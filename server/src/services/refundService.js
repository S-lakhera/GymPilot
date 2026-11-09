import crypto from 'crypto';
import { withTransaction } from '../config/db.js';
import { refundRepository } from '../repositories/refundRepository.js';
import { paymentRepository } from '../repositories/paymentRepository.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';

export const refundService = {
  /**
   * Process a partial or full refund with row locking and strict balance ceiling enforcement.
   */
  async processRefund({
    paymentId,
    amount,
    reason,
    gatewayRefundReference = null,
    adminUser,
  }) {
    if (!adminUser || adminUser.role !== 'admin') {
      throw new ForbiddenError(
        'Only administrators have permission to issue payment refunds.',
        null,
        'ADMIN_REFUND_ONLY'
      );
    }

    if (!paymentId) {
      throw new BadRequestError('Payment ID is required.', null, 'PAYMENT_ID_REQUIRED');
    }

    const refundAmount = Number(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      throw new BadRequestError('Refund amount must be a positive number.', null, 'INVALID_REFUND_AMOUNT');
    }

    if (!reason || !reason.trim()) {
      throw new BadRequestError('A valid refund reason is required for audit tracking.', null, 'REASON_REQUIRED');
    }

    return await withTransaction(async (conn) => {
      // 1. Lock payment row to prevent race conditions during concurrent refund requests
      const payment = await paymentRepository.findByIdForUpdate(paymentId, conn);
      if (!payment) {
        throw new NotFoundError('Payment record not found.', null, 'PAYMENT_NOT_FOUND');
      }

      // 2. Validate current payment status
      const refundableStatuses = ['COMPLETED', 'PARTIALLY_REFUNDED'];
      if (!refundableStatuses.includes(payment.payment_status)) {
        throw new BadRequestError(
          `Cannot refund a payment with status '${payment.payment_status}'. Only COMPLETED or PARTIALLY_REFUNDED payments can be refunded.`,
          null,
          'PAYMENT_NOT_REFUNDABLE'
        );
      }

      // 3. Calculate cumulative refund ceiling
      const alreadyRefunded = await refundRepository.getTotalRefundedForPayment(payment.id, conn);
      const remainingBalance = Math.round((Number(payment.amount) - alreadyRefunded) * 100) / 100;

      if (refundAmount > remainingBalance) {
        throw new BadRequestError(
          `Requested refund amount of ₹${refundAmount.toFixed(2)} exceeds remaining refundable balance of ₹${remainingBalance.toFixed(2)}.`,
          null,
          'REFUND_CEILING_EXCEEDED'
        );
      }

      // 4. Generate unique refund reference
      const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const refundReference = `REF-${Date.now()}-${randomSuffix}`;

      // 5. Insert refund audit record
      const refund = await refundRepository.create(
        {
          paymentId: payment.id,
          subscriptionId: payment.subscription_id,
          userId: payment.user_id,
          refundedById: adminUser.id,
          amount: refundAmount,
          reason: reason.trim(),
          refundStatus: 'COMPLETED',
          refundReference,
          gatewayRefundReference: gatewayRefundReference || `GW-REF-${Date.now()}`,
        },
        conn
      );

      // 6. Update payment status: PARTIALLY_REFUNDED or REFUNDED
      const newTotalRefunded = Math.round((alreadyRefunded + refundAmount) * 100) / 100;
      const isFullyRefunded = newTotalRefunded >= Number(payment.amount);
      const newPaymentStatus = isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await paymentRepository.updateStatus(
        payment.id,
        {
          paymentStatus: newPaymentStatus,
        },
        conn
      );

      const updatedRemainingBalance = Math.max(
        0,
        Math.round((Number(payment.amount) - newTotalRefunded) * 100) / 100
      );

      return {
        refund,
        paymentStatus: newPaymentStatus,
        totalRefunded: newTotalRefunded,
        remainingBalance: updatedRemainingBalance,
        isFullyRefunded,
      };
    });
  },

  /**
   * Retrieve all refunds for a specific payment with access control.
   */
  async getRefundsByPaymentId(paymentId, requestingUser) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment record not found.', null, 'PAYMENT_NOT_FOUND');
    }

    if (requestingUser.role !== 'admin' && payment.user_id !== requestingUser.id) {
      throw new ForbiddenError(
        'You do not have permission to view refunds for this payment.',
        null,
        'FORBIDDEN'
      );
    }

    return await refundRepository.findByPaymentId(paymentId);
  },

  /**
   * List refunds with audit filtering (Admin only).
   */
  async listRefunds(query = {}) {
    return await refundRepository.findAll(query);
  },

  /**
   * Get refund details by ID with access control.
   */
  async getRefundById(id, requestingUser) {
    const refund = await refundRepository.findById(id);
    if (!refund) {
      throw new NotFoundError('Refund record not found.', null, 'REFUND_NOT_FOUND');
    }

    if (requestingUser.role !== 'admin' && refund.user_id !== requestingUser.id) {
      throw new ForbiddenError(
        'You do not have permission to view this refund details.',
        null,
        'FORBIDDEN'
      );
    }

    return refund;
  },
};

export default refundService;
