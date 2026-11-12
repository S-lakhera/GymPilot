/**
 * GymPilot Client Application Constants
 */

export const USER_ROLES = {
  ADMIN: "admin",
  TRAINER: "trainer",
  MEMBER: "member",
};

/**
 * Flat route map for GymPilot.
 * All roles share /dashboard; internal rendering is role-dispatched.
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  APP_GATE: "/app",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",

  // Admin feature routes
  MEMBERS: "/members",
  TRAINERS: "/trainers",
  PLANS: "/plans",
  CATEGORIES: "/categories",
  SUBSCRIPTIONS: "/subscriptions",
  PAYMENTS: "/payments",
  DISCOUNTS: "/discounts",
  REFUNDS: "/refunds",

  // Member feature routes
  PASSES: "/passes",
  BILLING: "/billing",

  // Trainer feature routes (Phase 6 stubs)
  CLIENTS: "/clients",
  WORKOUTS: "/workouts",
  SCHEDULE: "/schedule",
};

/**
 * Maps each role to its dashboard API endpoint.
 */
export const DASHBOARD_API_ENDPOINTS = {
  [USER_ROLES.ADMIN]: "/dashboard/admin",
  [USER_ROLES.TRAINER]: "/dashboard/trainer",
  [USER_ROLES.MEMBER]: "/dashboard/member",
};

export const SUBSCRIPTION_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  QUEUED: "queued",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};
