export const PaymentStatus = Object.freeze({
  COMPLETED: "COMPLETED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
});

export const PaymentMethod = Object.freeze({
  CASH: "CASH",
  CARD: "CARD",
  UPI: "UPI",
  NET_BANKING: "NET_BANKING",
});

export const ALL_PAYMENT_STATUSES = Object.values(PaymentStatus);
export const ALL_PAYMENT_METHODS = Object.values(PaymentMethod);
