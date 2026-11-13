import React, { useRef, useEffect } from "react";
import { CheckCircle2, Receipt, Printer, ArrowRight, ShieldCheck } from "lucide-react";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Payment Receipt Dialog displayed after successful payment completion.
 *
 * @param {{
 *   isOpen: boolean,
 *   receiptData: {
 *     payment: Object,
 *     plan: Object,
 *     memberName?: string,
 *     memberEmail?: string
 *   },
 *   onClose: () => void
 * }} props
 */
export function PaymentReceiptModal({ isOpen, receiptData, onClose }) {
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !receiptData?.payment) return null;

  const payment = receiptData.payment;
  const plan = receiptData.plan;

  const handleGoToPasses = () => {
    onClose();
    navigate(ROUTES.PASSES);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-dialog-heading"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-workspace-card border border-workspace-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Success Banner */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 id="receipt-dialog-heading" className="text-xl font-bold font-display text-text-primary">
            Payment Confirmed!
          </h3>
          <p className="text-xs text-text-secondary">
            Your gym membership has been processed and confirmed.
          </p>
        </div>

        {/* Printable Receipt Card */}
        <div className="bg-slate-50 border border-workspace-border rounded-xl p-4.5 space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-workspace-border/80 pb-3">
            <div className="flex items-center gap-2 text-brand-dark font-bold">
              <Receipt className="w-4 h-4 text-emerald-accent" />
              <span>GymPilot Official Receipt</span>
            </div>
            <span className="text-[11px] font-mono text-text-secondary">
              {payment.transaction_reference || payment.transactionReference}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-text-muted block">Purchased Plan</span>
              <strong className="text-text-primary text-xs font-semibold">
                {plan?.name || "Gym Membership"}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-text-muted block">Duration</span>
              <strong className="text-text-primary text-xs font-semibold">
                {plan?.duration_days || plan?.durationDays || 30} Days
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-text-muted block">Payment Method</span>
              <span className="text-text-primary font-medium uppercase tracking-wider">
                {payment.payment_method || payment.paymentMethod || "UPI"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-text-muted block">Transaction Date</span>
              <span className="text-text-primary font-medium">
                {formatDateTime(payment.payment_date || payment.paymentDate || new Date())}
              </span>
            </div>
          </div>

          <div className="border-t border-workspace-border/80 pt-3 flex items-center justify-between">
            <span className="font-bold text-text-primary text-sm">Total Paid</span>
            <span className="font-bold font-display text-base text-emerald-accent">
              {formatCurrency(payment.amount)}
            </span>
          </div>
        </div>

        {/* Trust pill */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-accent" /> Verified Transaction • Stored securely in GymPilot Ledger
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-workspace-border">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
          <button
            type="button"
            onClick={handleGoToPasses}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            View My Passes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentReceiptModal;

