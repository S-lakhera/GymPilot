import { dashboardRepository } from '../repositories/dashboardRepository.js';

export const dashboardService = {
  /**
   * Assemble the Admin dashboard payload.
   * Runs financial + refund queries in parallel to prevent cartesian products.
   * Computes net revenue = gross revenue − completed refunds.
   */
  async getAdminDashboard() {
    // Run independent queries in parallel for performance
    const [
      membershipStats,
      subscriptionStats,
      financialStats,
      refundStats,
      categoryDistribution,
      recentTransactions,
      recentMembers,
    ] = await Promise.all([
      dashboardRepository.getAdminMembershipStats(),
      dashboardRepository.getAdminSubscriptionStats(),
      dashboardRepository.getAdminFinancialStats(),
      dashboardRepository.getAdminRefundStats(),
      dashboardRepository.getAdminCategoryDistribution(),
      dashboardRepository.getAdminRecentTransactions(5),
      dashboardRepository.getAdminRecentMembers(5),
    ]);

    // Net Revenue = Gross Completed Payments − Completed Refunds
    const netRevenue = Number((financialStats.grossRevenue - refundStats.totalRefunded).toFixed(2));
    const netRevenueMtd = Number((financialStats.grossRevenueMtd - refundStats.refundedMtd).toFixed(2));
    const netRevenueToday = Number((financialStats.grossRevenueToday - refundStats.refundedToday).toFixed(2));

    return {
      membership: membershipStats,
      subscriptions: subscriptionStats,
      financials: {
        grossRevenue: financialStats.grossRevenue,
        grossRevenueMtd: financialStats.grossRevenueMtd,
        grossRevenueToday: financialStats.grossRevenueToday,
        totalRefunded: refundStats.totalRefunded,
        refundedMtd: refundStats.refundedMtd,
        refundedToday: refundStats.refundedToday,
        netRevenue,
        netRevenueMtd,
        netRevenueToday,
        pendingPayments: financialStats.pendingPayments,
      },
      categoryDistribution,
      recentTransactions,
      recentMembers,
    };
  },

  /**
   * Assemble the Trainer dashboard payload.
   * Returns trainer profile and Phase 6 stubs for assignments/sessions/attendance.
   */
  async getTrainerDashboard(trainerUserId) {
    const profile = await dashboardRepository.getTrainerProfile(trainerUserId);

    return {
      profile: profile || null,
      // Phase 6 stubs — will be populated when attendance/assignment tables exist
      totalAssignedMembers: 0,
      assignedMembers: [],
      upcomingSessions: [],
    };
  },

  /**
   * Assemble the Member dashboard payload.
   * Retrieves active passes, queued renewals, nearest expiration, recent payments,
   * and profile completeness — all scoped to the authenticated member's user ID.
   */
  async getMemberDashboard(memberUserId) {
    const [
      subscriptions,
      nearestExpiration,
      recentPayments,
      profileCompleteness,
    ] = await Promise.all([
      dashboardRepository.getMemberSubscriptions(memberUserId),
      dashboardRepository.getMemberNearestExpiration(memberUserId),
      dashboardRepository.getMemberRecentPayments(memberUserId, 5),
      dashboardRepository.getMemberProfileCompleteness(memberUserId),
    ]);

    // Separate active and queued subscriptions
    const activePasses = subscriptions.filter((s) => s.status === 'active');
    const queuedRenewals = subscriptions.filter((s) => s.status === 'queued');

    return {
      activePasses,
      queuedRenewals,
      nearestExpiration,
      recentPayments,
      profileCompleteness,
    };
  },
};

export default dashboardService;

