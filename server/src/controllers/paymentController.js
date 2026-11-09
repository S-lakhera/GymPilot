import { paymentService } from '../services/paymentService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const paymentController = {
  /**
   * Idempotently confirm payment completion.
   */
  async confirmPayment(req, res) {
    const { transactionReference, gatewayReference, simulatedStatus } = req.body;

    const result = await paymentService.confirmPayment({
      transactionReference,
      gatewayReference: gatewayReference || null,
      simulatedStatus: simulatedStatus || 'SUCCESS',
      requestingUser: req.user,
    });

    return ApiResponse.success(res, result, result.message);
  },

  /**
   * Payment Gateway Webhook handler.
   */
  async handleWebhook(req, res) {
    const result = await paymentService.handleWebhook(req.body);
    return ApiResponse.success(res, result, 'Webhook processed successfully.');
  },

  /**
   * List payments audit log (Admin only).
   */
  async listPayments(req, res) {
    const { page, limit, userId, paymentStatus, paymentMethod, startDate, endDate, sortBy, sortOrder } = req.query;

    const result = await paymentService.listPayments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      userId: userId ? Number(userId) : null,
      paymentStatus: paymentStatus || null,
      paymentMethod: paymentMethod || null,
      startDate: startDate || null,
      endDate: endDate || null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Financial audit payments retrieved successfully.',
      data: result.payments,
      pagination: result.pagination,
    });
  },

  /**
   * Member receipt history.
   */
  async getMyPayments(req, res) {
    const { page, limit } = req.query;

    const result = await paymentService.getMyPayments(req.user.id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Payment receipts retrieved successfully.',
      data: result.payments,
      pagination: result.pagination,
    });
  },

  /**
   * Get single payment receipt by ID.
   */
  async getPaymentById(req, res) {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    return ApiResponse.success(res, { payment }, 'Payment receipt retrieved successfully.');
  },
};

export default paymentController;
