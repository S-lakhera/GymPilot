import { useState, useCallback, useEffect, useRef } from "react";
import { subscriptionApi } from "../api/subscriptionApi.js";
import { paymentApi } from "../api/paymentApi.js";
import { formatDate } from "../utils/formatters.js";

/**
 * Custom Hook to orchestrate Subscription Quoting, Checkout, and Payment Confirmation.
 *
 * @param {Object} plan - Currently selected plan object
 * @param {Array<Object>} [memberActivePasses=[]] - Array of member's current active & queued passes
 * @returns {Object}
 */
export function useCheckout(plan, memberActivePasses = []) {
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const [discountCode, setDiscountCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const isMountedRef = useRef(true);

  // Inspect existing category passes to compute scheduling behavior
  const schedulingInfo = (() => {
    if (!plan || !memberActivePasses || memberActivePasses.length === 0) {
      return { willQueue: false, isBlocked: false };
    }

    const categoryId = plan.category_id || plan.categoryId;
    const activePass = memberActivePasses.find(
      (p) =>
        (p.category_id === categoryId || p.categoryId === categoryId) &&
        p.status === "active"
    );
    const queuedPass = memberActivePasses.find(
      (p) =>
        (p.category_id === categoryId || p.categoryId === categoryId) &&
        p.status === "queued"
    );

    if (queuedPass) {
      return {
        willQueue: false,
        isBlocked: true,
        reason: "You already have an active pass and a queued renewal in this category.",
      };
    }

    if (activePass) {
      return {
        willQueue: true,
        isBlocked: false,
        activePassEndDate: activePass.end_date || activePass.endDate,
        message: `Renewal will be scheduled to start after your current pass expires on ${formatDate(
          activePass.end_date || activePass.endDate
        )}.`,
      };
    }

    return { willQueue: false, isBlocked: false };
  })();

  // Fetch real-time pricing quote
  const fetchQuote = useCallback(
    async (codeToApply = "") => {
      if (!plan?.id) return;

      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const quoteData = await subscriptionApi.getPricingQuote({
          planId: plan.id,
          discountCode: codeToApply.trim() || undefined,
        });

        if (isMountedRef.current) {
          setQuote(quoteData);
          setDiscountCode(codeToApply.trim());
          setQuoteError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setQuoteError(err.message || "Failed to calculate pricing quote.");
        }
      } finally {
        if (isMountedRef.current) {
          setQuoteLoading(false);
        }
      }
    },
    [plan?.id]
  );

  // Initial quote fetch when plan changes
  useEffect(() => {
    isMountedRef.current = true;
    if (plan?.id) {
      setCheckoutResult(null);
      setConfirmationResult(null);
      setCheckoutError(null);
      setConfirmationError(null);
      setDiscountCode("");
      fetchQuote("");
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [plan?.id, fetchQuote]);

  // Apply a promotional discount code
  const applyDiscount = useCallback(
    async (code) => {
      if (!code.trim()) return;
      await fetchQuote(code.trim());
    },
    [fetchQuote]
  );

  // Clear applied discount
  const clearDiscount = useCallback(async () => {
    await fetchQuote("");
  }, [fetchQuote]);

  // Execute subscription checkout (pessimistic lock on member, creates pending payment)
  const executeCheckout = useCallback(async () => {
    if (!plan?.id || schedulingInfo.isBlocked) return null;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const payload = {
        planId: plan.id,
        paymentMethod,
        discountCode: discountCode || undefined,
      };

      const result = await subscriptionApi.checkoutSubscription(payload);

      if (isMountedRef.current) {
        setCheckoutResult(result);
        setCheckoutError(null);
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setCheckoutError(err.message || "Failed to initiate checkout.");
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsCheckingOut(false);
      }
    }
  }, [plan?.id, paymentMethod, discountCode, schedulingInfo.isBlocked]);

  // Confirm payment in simulated gateway
  const confirmPaymentSimulation = useCallback(
    async (simulatedStatus = "SUCCESS") => {
      const txnRef =
        checkoutResult?.payment?.transaction_reference ||
        checkoutResult?.payment?.transactionReference;

      if (!txnRef) {
        setConfirmationError("No active transaction reference found to confirm.");
        return null;
      }

      setIsConfirming(true);
      setConfirmationError(null);

      try {
        const result = await paymentApi.confirmPayment({
          transactionReference: txnRef,
          simulatedStatus,
          gatewayReference: `SIMULATED-${paymentMethod}-${Date.now()}`,
        });

        if (isMountedRef.current) {
          setConfirmationResult(result);
          setConfirmationError(null);
        }
        return result;
      } catch (err) {
        if (isMountedRef.current) {
          setConfirmationError(err.message || "Payment confirmation failed.");
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsConfirming(false);
        }
      }
    },
    [checkoutResult, paymentMethod]
  );

  const resetCheckout = useCallback(() => {
    setCheckoutResult(null);
    setConfirmationResult(null);
    setCheckoutError(null);
    setConfirmationError(null);
    setDiscountCode("");
    fetchQuote("");
  }, [fetchQuote]);

  return {
    quote,
    quoteLoading,
    quoteError,
    discountCode,
    paymentMethod,
    setPaymentMethod,
    applyDiscount,
    clearDiscount,
    executeCheckout,
    isCheckingOut,
    checkoutError,
    checkoutResult,
    confirmPaymentSimulation,
    isConfirming,
    confirmationError,
    confirmationResult,
    schedulingInfo,
    resetCheckout,
  };
}

export default useCheckout;

