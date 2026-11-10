/**
 * GymPilot Client Application Constants
 */

export const USER_ROLES = {
  ADMIN: "admin",
  TRAINER: "trainer",
  MEMBER: "member",
};

export const DASHBOARD_ROUTES = {
  [USER_ROLES.ADMIN]: "/admin/dashboard",
  [USER_ROLES.TRAINER]: "/trainer/dashboard",
  [USER_ROLES.MEMBER]: "/member/dashboard",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  APP_GATE: "/app",
  PLANS: "/plans",
  PROFILE: "/profile",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_MEMBERS: "/admin/members",
  ADMIN_TRAINERS: "/admin/trainers",
  ADMIN_PLANS: "/admin/plans",
  ADMIN_PAYMENTS: "/admin/payments",
  TRAINER_DASHBOARD: "/trainer/dashboard",
  MEMBER_DASHBOARD: "/member/dashboard",
  MEMBER_SUBSCRIPTIONS: "/member/subscriptions",
  MEMBER_PAYMENTS: "/member/payments",
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
