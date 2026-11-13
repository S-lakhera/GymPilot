import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  Calendar,
  Layers,
  Shield,
  Loader2,
  ArrowRight,
  WifiOff,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";
import { useCheckout } from "../../hooks/useCheckout.js";
import { useNetworkStatus } from "../../hooks/useNetworkStatus.js";
import { DiscountCouponInput } from "./DiscountCouponInput.jsx";
import { SchedulingNotice } from "./SchedulingNotice.jsx";
import { MockPaymentGatewayModal } from "./MockPaymentGatewayModal.jsx";
import { PaymentReceiptModal } from "./PaymentReceiptModal.jsx";

/**
 * In-Place Member Checkout Modal.
 *
 * @param {{
 *   isOpen: boolean,
 *   plan: Object|null,
 *   memberActivePasses?: Array<Object>,
 *   onClose: () => void,
 *   onCheckoutComplete?: (result: Object) => void
 * }} props
 */
export function CheckoutModal({
  isOpen,
  plan,
  memberActivePasses = [],
  onClose,
  onCheckoutComplete,
}) {
  const {
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
    schedulingInfo,
    resetCheckout,
  } = useCheckout(plan, memberActivePasses);

  const [showGateway, setShowGateway] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const { isOnline } = useNetworkStatus();

  const dialogRef = useRef(null);
  const wasOpenRef = useRef(false);
  const previouslyFocusedElementRef = useRef(null);

  // Initialize modal state only on open transition and restore focus on close
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      previouslyFocusedElementRef.current = document.activeElement;
      setShowGateway(false);
      setShowReceipt(false);
      setReceiptData(null);
    }
    wasOpenRef.current = isOpen;

    if (!isOpen && previouslyFocusedElementRef.current) {
      if (typeof previouslyFocusedElementRef.current.focus === "function") {
        previouslyFocusedElementRef.current.focus();
      }
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen]);

  // Unmount cleanup to guarantee focus restoration
  useEffect(() => {
    return () => {
      if (previouslyFocusedElementRef.current) {
        if (typeof previouslyFocusedElementRef.current.focus === "function") {
          previouslyFocusedElementRef.current.focus();
        }
        previouslyFocusedElementRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation & dismissal listener
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (showGateway) return; // MockPaymentGatewayModal handles its own keys
        if (e.key === "Escape" && !showReceipt) {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable.length) {
            e.preventDefault();
            dialogRef.current.focus();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (
              document.activeElement === first ||
              document.activeElement === dialogRef.current
            ) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (
              document.activeElement === last ||
              document.activeElement === dialogRef.current
            ) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, showGateway, showReceipt, onClose]);

  // Accessible focus containment
  useEffect(() => {
    if (isOpen && !showGateway && !showReceipt && dialogRef.current) {
      const firstInput = dialogRef.current.querySelector(
        'button:not([disabled]), input:not([disabled])'
      );
      if (firstInput) {
        firstInput.focus();
      } else {
        dialogRef.current.focus();
      }
    }
  }, [isOpen, showGateway, showReceipt]);

  if (!isOpen || !plan) return null;

  const basePrice = quote ? quote.baseAmount : Number(plan.price) || 0;
  const discountAmount = quote ? quote.discountAmount : 0;
  const finalAmount = quote ? quote.finalAmount : basePrice;

  const handleProceedToPayment = async () => {
    const res = await executeCheckout();
    if (res && res.payment) {
      setShowGateway(true);
    }
  };

  const handleGatewaySuccess = (confirmationResult) => {
    setShowGateway(false);
    setReceiptData({
      payment: confirmationResult.payment,
      plan,
    });
    setShowReceipt(true);
    if (onCheckoutComplete) {
      onCheckoutComplete(confirmationResult);
    }
  };

  const handleCloseAll = () => {
    setShowGateway(false);
    setShowReceipt(false);
    resetCheckout();
    onClose();
  };

  return (
    <>
      {/* 1. Main In-Place Checkout Modal */}
      {!showGateway && !showReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/70 backdrop-blur-sm animate-in fade-in duration-200 outline-none"
        >
          <div className="bg-workspace-card border border-workspace-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-workspace-border flex items-center justify-between">
              <div>
                <h3 id="checkout-modal-title" className="text-base font-bold font-display text-text-primary">
                  Membership Checkout
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Review pricing, apply discount coupons, and complete checkout
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg transition-colors"
                title="Close checkout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Selected Plan Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-workspace-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {plan.category_name || plan.categoryName || "Workout Plan"}
                  </span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    {plan.duration_days || plan.durationDays} Days Duration
                  </span>
                </div>
                <h4 className="text-base font-bold text-text-primary">{plan.name}</h4>
                {plan.description && (
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {plan.description}
                  </p>
                )}
              </div>

              {/* Dynamic Scheduling Notice */}
              <SchedulingNotice schedulingInfo={schedulingInfo} />

              {/* Promotional Discount Coupon Field */}
              <DiscountCouponInput
                discountCode={discountCode}
                quote={quote}
                isLoading={quoteLoading}
                error={quoteError}
                onApply={applyDiscount}
                onClear={clearDiscount}
              />

              {/* Pricing Breakdown Card */}
              <div className="p-4 rounded-xl bg-workspace border border-workspace-border space-y-2 text-xs">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Base Plan Price:</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(basePrice)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Promotional Savings:</span>
                    <span className="font-bold">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-workspace-border flex items-center justify-between text-sm">
                  <span className="font-bold text-text-primary">Total Payable:</span>
                  <span className="font-bold font-display text-base text-emerald-accent">
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-primary block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "UPI"
                        ? "border-emerald-accent bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-accent/30 font-bold"
                        : "border-workspace-border bg-workspace text-text-secondary hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-accent" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "CARD"
                        ? "border-emerald-accent bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-accent/30 font-bold"
                        : "border-workspace-border bg-workspace text-text-secondary hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-accent" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("NET_BANKING")}
                    className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "NET_BANKING"
                        ? "border-emerald-accent bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-accent/30 font-bold"
                        : "border-workspace-border bg-workspace text-text-secondary hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-accent" />
                    <span>Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Checkout Error Message */}
              {checkoutError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-status-danger font-medium">
                  {checkoutError}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-workspace-border flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              {!isOnline && (
                <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" /> Paused Offline
                </span>
              )}

              <button
                type="button"
                disabled={schedulingInfo.isBlocked || isCheckingOut || quoteLoading || !isOnline}
                title={!isOnline ? "Checkout is paused in offline mode" : undefined}
                onClick={handleProceedToPayment}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Securing Order...
                  </>
                ) : (
                  <>
                    Proceed to Pay {formatCurrency(finalAmount)}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Mock Payment Gateway Modal */}
      {showGateway && checkoutResult?.payment && (
        <MockPaymentGatewayModal
          isOpen={showGateway}
          amount={finalAmount}
          transactionReference={
            checkoutResult.payment.transaction_reference ||
            checkoutResult.payment.transactionReference
          }
          initialMethod={paymentMethod}
          onConfirm={confirmPaymentSimulation}
          onSuccess={handleGatewaySuccess}
          onClose={() => setShowGateway(false)}
        />
      )}

      {/* 3. Official Payment Receipt Dialog */}
      {showReceipt && receiptData && (
        <PaymentReceiptModal
          isOpen={showReceipt}
          receiptData={receiptData}
          onClose={handleCloseAll}
        />
      )}
    </>
  );
}

export default CheckoutModal;

