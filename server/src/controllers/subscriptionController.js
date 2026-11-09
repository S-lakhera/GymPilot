import { subscriptionService } from '../services/subscriptionService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const subscriptionController = {
  /**
   * Calculate a real-time pricing quote before completing checkout.
   */
  async getQuote(req, res) {
    const { planId, discountCode } = req.body;
    const quote = await subscriptionService.getPricingQuote({
      planId: planId ? Number(planId) : null,
      discountCode: discountCode || null,
      userId: req.user.id,
    });

    return ApiResponse.success(res, { quote }, 'Pricing quote calculated successfully.');
  },

  /**
   * Execute subscription checkout with pessimistic locking.
   */
  async checkout(req, res) {
    const { planId, paymentMethod, discountCode, startDate, memberId, gatewayReference } = req.body;

    const result = await subscriptionService.checkoutSubscription({
      planId: planId ? Number(planId) : null,
      paymentMethod,
      discountCode: discountCode || null,
      startDate: startDate || null,
      memberId: memberId ? Number(memberId) : null,
      gatewayReference: gatewayReference || null,
      requestingUser: req.user,
    });

    return ApiResponse.created(res, result, 'Subscription checkout initiated successfully.');
  },

  /**
   * List subscriptions with role-aware scoping and pagination.
   */
  async listSubscriptions(req, res) {
    const { page, limit, status, userId, categoryId, sortBy, sortOrder } = req.query;

    const result = await subscriptionService.listSubscriptions(
      {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        status: status || null,
        userId: userId ? Number(userId) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        sortBy,
        sortOrder,
      },
      req.user
    );

    return res.status(200).json({
      status: 'success',
      message: 'Subscriptions retrieved successfully.',
      data: result.subscriptions,
      pagination: result.pagination,
    });
  },

  /**
   * Retrieve single subscription details.
   */
  async getSubscriptionById(req, res) {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
    return ApiResponse.success(res, { subscription }, 'Subscription details retrieved successfully.');
  },
};

export default subscriptionController;
