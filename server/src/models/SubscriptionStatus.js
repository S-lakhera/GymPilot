export const SubscriptionStatus = Object.freeze({
  PENDING_PAYMENT: "pending_payment",
  QUEUED: "queued",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
});

export const ALL_SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus);
