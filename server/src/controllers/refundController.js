import { refundService } from '../services/refundService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const refundController = {
  /**
   * Process a payment refund (Admin only).
   */
  async processRefund(req, res) {
    const { paymentId, amount, reason, gatewayRefundReference } = req.body;

    const result = await refundService.processRefund({
      paymentId: paymentId ? Number(paymentId) : null,
      amount: Number(amount),
      reason,
      gatewayRefundReference: gatewayRefundReference || null,
      adminUser: req.user,
    });

    return ApiResponse.created(res, result, 'Refund processed successfully.');
  },

  /**
   * List refunds for a specific payment.
   */
  async getRefundsByPaymentId(req, res) {
    const refunds = await refundService.getRefundsByPaymentId(req.params.paymentId, req.user);
    return ApiResponse.success(res, { refunds }, 'Payment refunds retrieved successfully.');
  },

  /**
   * List all refunds with pagination and filtering (Admin only).
   */
  async listRefunds(req, res) {
    const { page, limit, paymentId, userId, refundedById, refundStatus, sortBy, sortOrder } = req.query;

    const result = await refundService.listRefunds({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      paymentId: paymentId ? Number(paymentId) : null,
      userId: userId ? Number(userId) : null,
      refundedById: refundedById ? Number(refundedById) : null,
      refundStatus: refundStatus || null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Refund audit log retrieved successfully.',
      data: result.refunds,
      pagination: result.pagination,
    });
  },

  /**
   * Retrieve single refund by ID.
   */
  async getRefundById(req, res) {
    const refund = await refundService.getRefundById(req.params.id, req.user);
    return ApiResponse.success(res, { refund }, 'Refund details retrieved successfully.');
  },
};

export default refundController;
