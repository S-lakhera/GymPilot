import crypto from 'crypto';
import { withTransaction } from '../config/db.js';
import { subscriptionRepository } from '../repositories/subscriptionRepository.js';
import { paymentRepository } from '../repositories/paymentRepository.js';
import { planRepository } from '../repositories/planRepository.js';
import { discountRepository } from '../repositories/discountRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { pricingService } from './pricingService.js';
import { refundService } from './refundService.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';

/**
 * UTC-safe date parser to avoid timezone boundary shifts.
 */
function parseDateParts(dateInput) {
  if (dateInput instanceof Date) {
    return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
  }
  const str = String(dateInput).slice(0, 10);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateString(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function addDays(dateInput, days) {
  const d = parseDateParts(dateInput);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return formatDateString(d);
}

function getTodayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset).toISOString().slice(0, 10);
}

function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

export const subscriptionService = {
  /**
   * Calculate a real-time pricing quote preview without altering database state.
   */
  async getPricingQuote({ planId, discountCode = null, userId = null }) {
    if (!planId) {
      throw new BadRequestError('Plan ID is required to generate a pricing quote.', null, 'PLAN_ID_REQUIRED');
    }

    const plan = await planRepository.findById(planId);
    if (!plan || !plan.is_active || !plan.category_is_active) {
      throw new NotFoundError('Plan not found or currently inactive.', null, 'PLAN_INACTIVE');
    }

    const pricing = await pricingService.validateAndCalculateDiscount({
      plan,
      discountCode,
      userId,
      lockDiscount: false,
    });

    return {
      planId: plan.id,
      planName: plan.name,
      categoryId: plan.category_id,
      categoryName: plan.category_name,
      durationDays: plan.duration_days,
      baseAmount: pricing.baseAmount,
      discountAmount: pricing.discountAmount,
      finalAmount: pricing.finalAmount,
      discountCode: pricing.discount ? pricing.discount.code : null,
      discountName: pricing.discount ? pricing.discount.name : null,
      currency: 'INR',
    };
  },

  /**
   * Execute checkout with ACID concurrency row locking and two-phase payment lifecycle.
   */
  async checkoutSubscription({
    planId,
    paymentMethod,
    discountCode = null,
    startDate = null,
    memberId = null,
    gatewayReference = null,
    requestingUser,
  }) {
    if (!planId) {
      throw new BadRequestError('Plan ID is required.', null, 'PLAN_ID_REQUIRED');
    }

    const validMethods = ['CASH', 'CARD', 'UPI', 'NET_BANKING'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      throw new BadRequestError(
        `Invalid payment method. Allowed values are: ${validMethods.join(', ')}`,
        null,
        'INVALID_PAYMENT_METHOD'
      );
    }

    // Role-based target user determination
    let targetUserId = requestingUser.id;
    if (requestingUser.role === 'admin' && memberId) {
      targetUserId = Number(memberId);
    }

    // Front-desk cash payments are restricted to administrators
    if (paymentMethod === 'CASH' && requestingUser.role !== 'admin') {
      throw new ForbiddenError(
        'Cash payments must be processed by a front-desk administrator.',
        null,
        'CASH_ADMIN_ONLY'
      );
    }

    if (startDate && !isValidDateFormat(startDate)) {
      throw new BadRequestError(
        'Invalid start date format. Expected YYYY-MM-DD.',
        null,
        'INVALID_DATE_FORMAT'
      );
    }

    const today = getTodayIST();

    // Execute atomic checkout with row-level serialization
    return await withTransaction(async (conn) => {
      // 1. Pessimistic lock on parent user record to serialize concurrent checkouts
      const lockedUser = await userRepository.lockUser(targetUserId, conn);
      if (!lockedUser) {
        throw new NotFoundError('Target member was not found.', null, 'USER_NOT_FOUND');
      }

      // 2. Fetch and validate plan
      const plan = await planRepository.findById(planId, conn);
      if (!plan || !plan.is_active || !plan.category_is_active) {
        throw new BadRequestError(
          'Selected plan is not available or inactive.',
          null,
          'PLAN_UNAVAILABLE'
        );
      }

      // 3. Inspect existing active and queued subscriptions in this plan category
      const existingCategorySubs = await subscriptionRepository.findCategorySubscriptions(
        targetUserId,
        plan.category_id,
        conn
      );

      const activeSub = existingCategorySubs.find((s) => s.status === 'active');
      const queuedSub = existingCategorySubs.find((s) => s.status === 'queued');

      // Enforce category capacity rule: max 1 active + 1 queued renewal
      if (queuedSub) {
        throw new BadRequestError(
          'You already have an active subscription and a queued renewal in this category. You cannot queue additional subscriptions.',
          null,
          'MAX_QUEUED_EXCEEDED'
        );
      }

      // Calculate sequential dates and target activation status
      let calculatedStartDate;
      let targetStatusOnConfirmation;

      if (activeSub) {
        // Renewal starts the calendar day immediately following the active subscription's expiration
        calculatedStartDate = addDays(activeSub.end_date, 1);
        targetStatusOnConfirmation = 'queued';
      } else {
        // No current active subscription in category
        if (startDate) {
          if (startDate < today && requestingUser.role !== 'admin') {
            throw new BadRequestError(
              'Subscription start date cannot be in the past.',
              null,
              'PAST_START_DATE'
            );
          }
          calculatedStartDate = startDate;
        } else {
          calculatedStartDate = today;
        }

        targetStatusOnConfirmation = calculatedStartDate > today ? 'queued' : 'active';
      }

      const calculatedEndDate = addDays(calculatedStartDate, Number(plan.duration_days) - 1);

      // 4. Validate promotional discount and calculate backend pricing
      const pricing = await pricingService.validateAndCalculateDiscount({
        plan,
        discountCode,
        userId: targetUserId,
        connection: conn,
        lockDiscount: true,
      });

      // 5. Determine initial subscription and payment statuses based on payment method
      const isCash = paymentMethod === 'CASH';
      const initialSubscriptionStatus = isCash ? targetStatusOnConfirmation : 'pending_payment';
      const initialPaymentStatus = isCash ? 'COMPLETED' : 'PENDING';
      const recordedById = isCash ? requestingUser.id : null;

      // 6. Generate collision-free transaction reference
      const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const transactionReference = `TXN-${Date.now()}-${randomSuffix}`;

      const discountId = pricing.discount ? pricing.discount.id : null;
      const discountCodeResult = pricing.discount ? pricing.discount.code : null;

      // 7. Insert subscription record
      const subscription = await subscriptionRepository.create(
        {
          userId: targetUserId,
          planId: plan.id,
          startDate: calculatedStartDate,
          endDate: calculatedEndDate,
          baseAmount: pricing.baseAmount,
          discountId,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
          currency: 'INR',
          status: initialSubscriptionStatus,
        },
        conn
      );

      // 8. Insert payment audit record
      const payment = await paymentRepository.create(
        {
          subscriptionId: subscription.id,
          userId: targetUserId,
          recordedById,
          amount: pricing.finalAmount,
          baseAmount: pricing.baseAmount,
          discountAmount: pricing.discountAmount,
          currency: 'INR',
          paymentMethod,
          paymentStatus: initialPaymentStatus,
          transactionReference,
          gatewayReference: gatewayReference || (isCash ? 'CASH-RECEIPT' : null),
          paymentDate: new Date(),
        },
        conn
      );

      // 9. If immediate front-desk cash payment, increment discount usage counter now
      if (isCash && discountId) {
        await discountRepository.incrementTimesUsed(discountId, conn);
      }

      return {
        subscription,
        payment,
        pricing: {
          baseAmount: pricing.baseAmount,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
          discountCode: discountCodeResult,
        },
      };
    });
  },

  /**
   * List subscriptions with role-aware scoping and pagination.
   */
  async listSubscriptions(query = {}, requestingUser) {
    const filters = { ...query };

    // Members can only view their own subscriptions
    if (requestingUser.role !== 'admin') {
      filters.userId = requestingUser.id;
    }

    return await subscriptionRepository.findAll(filters);
  },

  /**
   * Retrieve a subscription by ID with permission enforcement.
   */
  async getSubscriptionById(id, requestingUser) {
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    if (requestingUser.role !== 'admin' && subscription.user_id !== requestingUser.id) {
      throw new ForbiddenError(
        'You do not have permission to access this subscription.',
        null,
        'FORBIDDEN'
      );
    }

    return subscription;
  },

  /**
   * Cancel an existing subscription with optional queued renewal governance and partial/full refund.
   */
  async cancelSubscription({
    subscriptionId,
    refundAmount = null,
    refundReason = null,
    promoteQueued = false,
    cancelQueued = false,
    requestingUser,
  }) {
    if (!subscriptionId) {
      throw new BadRequestError('Subscription ID is required.', null, 'SUBSCRIPTION_ID_REQUIRED');
    }

    const today = getTodayIST();

    return await withTransaction(async (conn) => {
      const sub = await subscriptionRepository.findByIdForUpdate(subscriptionId, conn);
      if (!sub) {
        throw new NotFoundError('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
      }

      if (requestingUser.role !== 'admin' && sub.user_id !== requestingUser.id) {
        throw new ForbiddenError(
          'You do not have permission to cancel this subscription.',
          null,
          'FORBIDDEN'
        );
      }

      if (sub.status === 'cancelled') {
        throw new BadRequestError('Subscription is already cancelled.', null, 'ALREADY_CANCELLED');
      }

      if (sub.status === 'expired') {
        throw new BadRequestError('Cannot cancel an expired subscription.', null, 'ALREADY_EXPIRED');
      }

      // 1. Update target subscription status to cancelled
      await subscriptionRepository.updateStatus(sub.id, 'cancelled', conn);

      // 2. Queued Renewal Governance in the same plan category
      let promotedSub = null;
      let cancelledQueuedSub = null;

      const plan = await planRepository.findById(sub.plan_id, conn);
      const categoryId = plan ? plan.category_id : null;

      if (categoryId) {
        const queuedSub = await subscriptionRepository.findQueuedSubscriptionInCategory(
          sub.user_id,
          categoryId,
          conn
        );

        if (queuedSub) {
          if (promoteQueued) {
            // Promote queued renewal to activate immediately starting today
            const newEndDate = addDays(today, Number(queuedSub.duration_days) - 1);
            await subscriptionRepository.updateDatesAndStatus(
              queuedSub.id,
              {
                startDate: today,
                endDate: newEndDate,
                status: 'active',
              },
              conn
            );
            promotedSub = await subscriptionRepository.findById(queuedSub.id, conn);
          } else if (cancelQueued) {
            await subscriptionRepository.updateStatus(queuedSub.id, 'cancelled', conn);
            cancelledQueuedSub = await subscriptionRepository.findById(queuedSub.id, conn);
          }
        }
      }

      // 3. Optional refund processing (Admin only)
      let refundDetails = null;
      if (refundAmount && Number(refundAmount) > 0) {
        if (requestingUser.role !== 'admin') {
          throw new ForbiddenError(
            'Only administrators can issue refunds upon subscription cancellation.',
            null,
            'ADMIN_REFUND_ONLY'
          );
        }

        const [payments] = await conn.query(
          `SELECT id FROM payments 
           WHERE subscription_id = ? AND payment_status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
           ORDER BY id DESC LIMIT 1`,
          [sub.id]
        );

        if (payments.length > 0) {
          refundDetails = await refundService.processRefund({
            paymentId: payments[0].id,
            amount: refundAmount,
            reason: refundReason || `Cancellation of subscription #${sub.id}`,
            adminUser: requestingUser,
          });
        }
      }

      const updatedSubscription = await subscriptionRepository.findById(sub.id, conn);

      return {
        subscription: updatedSubscription,
        promotedSubscription: promotedSub,
        cancelledQueuedSubscription: cancelledQueuedSub,
        refund: refundDetails,
        message: 'Subscription successfully cancelled.',
      };
    });
  },

  /**
   * System-wide status synchronization job.
   * Auto-expires past subscriptions, activates eligible queued renewals, and purges stale pending checkouts.
   */
  async syncStatuses() {
    const today = getTodayIST();

    return await withTransaction(async (conn) => {
      // 1. Expire active subscriptions where end_date < today
      const [expireResult] = await conn.query(
        `UPDATE subscriptions 
         SET status = 'expired' 
         WHERE status = 'active' AND end_date < ?`,
        [today]
      );

      // 2. Activate queued renewals where start_date <= today and no active sub currently runs in category
      const [eligibleQueued] = await conn.query(
        `SELECT s.id, s.user_id, p.category_id 
         FROM subscriptions s
         INNER JOIN plans p ON s.plan_id = p.id
         WHERE s.status = 'queued' AND s.start_date <= ?`,
        [today]
      );

      let activatedCount = 0;
      for (const qSub of eligibleQueued) {
        const [activeCheck] = await conn.query(
          `SELECT s.id FROM subscriptions s
           INNER JOIN plans p ON s.plan_id = p.id
           WHERE s.user_id = ? AND p.category_id = ? AND s.status = 'active'`,
          [qSub.user_id, qSub.category_id]
        );

        if (activeCheck.length === 0) {
          await subscriptionRepository.updateStatus(qSub.id, 'active', conn);
          activatedCount++;
        }
      }

      // 3. Purge/cancel stale pending_payment checkouts older than 24 hours
      const [purgeSubResult] = await conn.query(
        `UPDATE subscriptions 
         SET status = 'cancelled' 
         WHERE status = 'pending_payment' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );

      const [purgePayResult] = await conn.query(
        `UPDATE payments 
         SET payment_status = 'FAILED' 
         WHERE payment_status = 'PENDING' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );

      return {
        expiredSubscriptions: expireResult.affectedRows,
        activatedQueuedSubscriptions: activatedCount,
        purgedStaleSubscriptions: purgeSubResult.affectedRows,
        purgedStalePayments: purgePayResult.affectedRows,
        syncedAt: new Date().toISOString(),
      };
    });
  },
};

export default subscriptionService;
