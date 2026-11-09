import { withTransaction } from '../config/db.js';
import { paymentRepository } from '../repositories/paymentRepository.js';
import { subscriptionRepository } from '../repositories/subscriptionRepository.js';
import { discountRepository } from '../repositories/discountRepository.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';

function getTodayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset).toISOString().slice(0, 10);
}

export const paymentService = {
  /**
   * Idempotent two-phase payment confirmation.
   * Locks the payment row, promotes the pending subscription, and applies promotional discount counters.
   */
  async confirmPayment({
    transactionReference,
    gatewayReference = null,
    simulatedStatus = 'SUCCESS',
    requestingUser = null,
  }) {
    if (!transactionReference) {
      throw new BadRequestError('Transaction reference is required.', null, 'TXN_REF_REQUIRED');
    }

    const today = getTodayIST();

    return await withTransaction(async (conn) => {
      // 1. Lock payment row to prevent race conditions during parallel webhook / callback delivery
      const payment = await paymentRepository.findByTransactionReferenceForUpdate(
        transactionReference,
        conn
      );

      if (!payment) {
        throw new NotFoundError(
          `Payment record with reference '${transactionReference}' not found.`,
          null,
          'PAYMENT_NOT_FOUND'
        );
      }

      // Check user permissions if requested by a member directly
      if (
        requestingUser &&
        requestingUser.role !== 'admin' &&
        payment.user_id !== requestingUser.id
      ) {
        throw new ForbiddenError(
          'You do not have permission to confirm this payment.',
          null,
          'FORBIDDEN'
        );
      }

      // 2. Idempotency Check: if already completed, return gracefully without re-incrementing or re-activating
      if (payment.payment_status === 'COMPLETED') {
        const fullPayment = await paymentRepository.findById(payment.id, conn);
        return {
          alreadyProcessed: true,
          payment: fullPayment,
          message: 'Payment has already been confirmed and completed.',
        };
      }

      // Only PENDING payments can be confirmed
      if (payment.payment_status !== 'PENDING') {
        throw new BadRequestError(
          `Cannot confirm payment with status '${payment.payment_status}'. Only PENDING payments can be confirmed.`,
          null,
          'INVALID_PAYMENT_STATE'
        );
      }

      const assignedGatewayRef =
        gatewayReference || payment.gateway_reference || `SIMULATED-${Date.now()}`;

      // 3. Handle Failure Scenario
      if (simulatedStatus === 'FAILED') {
        await paymentRepository.updateStatus(
          payment.id,
          {
            paymentStatus: 'FAILED',
            gatewayReference: assignedGatewayRef,
            paymentDate: new Date(),
          },
          conn
        );

        const updatedPayment = await paymentRepository.findById(payment.id, conn);
        return {
          alreadyProcessed: false,
          payment: updatedPayment,
          message: 'Payment marked as FAILED.',
        };
      }

      // 4. Handle Success Scenario: mark COMPLETED
      await paymentRepository.updateStatus(
        payment.id,
        {
          paymentStatus: 'COMPLETED',
          gatewayReference: assignedGatewayRef,
          paymentDate: new Date(),
        },
        conn
      );

      // 5. Promote Subscription from pending_payment to active or queued
      const sub = await subscriptionRepository.findById(payment.subscription_id, conn);
      let targetSubStatus = 'active';

      if (sub && sub.status === 'pending_payment') {
        const subStartDate = String(sub.start_date).slice(0, 10);

        if (subStartDate > today) {
          targetSubStatus = 'queued';
        } else {
          // Check if an existing active subscription already runs in this category
          const categorySubs = await subscriptionRepository.findCategorySubscriptions(
            sub.user_id,
            sub.category_id,
            conn
          );
          const hasOtherActive = categorySubs.some(
            (s) => s.id !== sub.id && s.status === 'active'
          );
          targetSubStatus = hasOtherActive ? 'queued' : 'active';
        }

        await subscriptionRepository.updateStatus(sub.id, targetSubStatus, conn);

        // 6. Atomically increment discount times_used counter upon verified payment completion
        if (sub.discount_id) {
          await discountRepository.incrementTimesUsed(sub.discount_id, conn);
        }
      }

      const updatedPayment = await paymentRepository.findById(payment.id, conn);
      const updatedSubscription = await subscriptionRepository.findById(payment.subscription_id, conn);

      return {
        alreadyProcessed: false,
        payment: updatedPayment,
        subscription: updatedSubscription,
        message: 'Payment successfully verified and subscription activated.',
      };
    });
  },

  /**
   * Inbound Payment Gateway Webhook handler.
   * Expects standard gateway event format or simulated webhook payload.
   */
  async handleWebhook(payload) {
    // Extract transactionReference and status from generic webhook payload
    const transactionReference =
      payload.transactionReference ||
      payload.transaction_reference ||
      payload?.data?.transactionReference ||
      payload?.data?.order?.id;

    const gatewayReference =
      payload.gatewayReference ||
      payload.gateway_reference ||
      payload?.data?.id ||
      payload?.data?.payment_id ||
      null;

    const status =
      payload.status ||
      payload?.data?.status ||
      (payload.event === 'payment.captured' || payload.event === 'charge.success'
        ? 'SUCCESS'
        : 'FAILED');

    if (!transactionReference) {
      throw new BadRequestError(
        'Webhook payload missing recognizable transaction reference.',
        null,
        'INVALID_WEBHOOK_PAYLOAD'
      );
    }

    const simulatedStatus = String(status).toUpperCase() === 'FAILED' ? 'FAILED' : 'SUCCESS';

    return await this.confirmPayment({
      transactionReference,
      gatewayReference,
      simulatedStatus,
      requestingUser: null, // Webhooks run in system context
    });
  },

  /**
   * List financial audit logs (Admin only).
   */
  async listPayments(query = {}) {
    return await paymentRepository.findAll(query);
  },

  /**
   * Member receipt history (own payments).
   */
  async getMyPayments(userId, query = {}) {
    return await paymentRepository.findByUserId(userId, query);
  },

  /**
   * Retrieve payment by ID with role-based permission check.
   */
  async getPaymentById(id, requestingUser) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment not found.', null, 'PAYMENT_NOT_FOUND');
    }

    if (requestingUser.role !== 'admin' && payment.user_id !== requestingUser.id) {
      throw new ForbiddenError(
        'You do not have permission to view this payment receipt.',
        null,
        'FORBIDDEN'
      );
    }

    return payment;
  },
};

export default paymentService;
