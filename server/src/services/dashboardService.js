import { dashboardRepository } from '../repositories/dashboardRepository.js';

export const dashboardService = {
  /**
   * Assemble the Admin dashboard payload.
   * Runs financial + refund queries in parallel to prevent cartesian products.
   * Computes net revenue = gross revenue − completed refunds.
   */
  async getAdminDashboard() {
    // Run independent queries in parallel for performance; peripheral feeds degrade gracefully
    const [
      membershipStats,
      subscriptionStats,
      financialStats,
      refundStats,
      categoryDistribution,
      recentTransactions,
      recentMembers,
    ] = await Promise.all([
      dashboardRepository.getAdminMembershipStats().catch((err) => {
        console.error('Failed to load membership stats:', err);
        return { totalMembers: 0, activeMembers: 0, activeTrainers: 0 };
      }),
      dashboardRepository.getAdminSubscriptionStats().catch((err) => {
        console.error('Failed to load subscription stats:', err);
        return { activeSubscriptions: 0, queuedSubscriptions: 0, expiringSoon: 0, expiredSubscriptions: 0 };
      }),
      dashboardRepository.getAdminFinancialStats(), // fail-fast for financial integrity
      dashboardRepository.getAdminRefundStats(),    // fail-fast for net revenue calculation
      dashboardRepository.getAdminCategoryDistribution().catch((err) => {
        console.error('Failed to load category distribution feed:', err);
        return [];
      }),
      dashboardRepository.getAdminRecentTransactions(5).catch((err) => {
        console.error('Failed to load recent transactions feed:', err);
        return [];
      }),
      dashboardRepository.getAdminRecentMembers(5).catch((err) => {
        console.error('Failed to load recent members feed:', err);
        return [];
      }),
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
      dashboardRepository.getMemberNearestExpiration(memberUserId).catch((err) => {
        console.error('Failed to load member nearest expiration:', err);
        return null;
      }),
      dashboardRepository.getMemberRecentPayments(memberUserId, 5).catch((err) => {
        console.error('Failed to load member recent payments feed:', err);
        return [];
      }),
      dashboardRepository.getMemberProfileCompleteness(memberUserId).catch((err) => {
        console.error('Failed to load member profile completeness:', err);
        return null;
      }),
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

