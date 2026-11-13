import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Lock,
  Loader2,
  X,
  Smartphone,
  CreditCard,
  Building2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";
import { UpiPaymentView } from "./UpiPaymentView.jsx";
import { CardPaymentView } from "./CardPaymentView.jsx";
import { NetBankingPaymentView } from "./NetBankingPaymentView.jsx";

/**
 * Self-Contained Mock Payment Gateway Modal.
 * Simulates an interactive, realistic Indian payment gateway (Razorpay/UPI/Card/NetBanking)
 * with explicit SUCCESS and FAILED testing outcomes for portfolio demonstration.
 *
 * @param {{
 *   isOpen: boolean,
 *   amount: number,
 *   transactionReference: string,
 *   initialMethod?: 'UPI'|'CARD'|'NET_BANKING',
 *   onConfirm: (outcome: 'SUCCESS'|'FAILED') => Promise<Object|null>,
 *   onSuccess: (confirmationResult: Object) => void,
 *   onClose: () => void
 * }} props
 */
export function MockPaymentGatewayModal({
  isOpen,
  amount,
  transactionReference,
  initialMethod = "UPI",
  onConfirm,
  onSuccess,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialMethod);
  const [outcomeSimulation, setOutcomeSimulation] = useState("SUCCESS");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form states for simulated payment methods
  const [vpa, setVpa] = useState("member@upi");
  const [cardData, setCardData] = useState({
    cardNumber: "4532 8920 1234 5678",
    cardHolder: "ALEX SHARMA",
    expiry: "12/28",
    cvv: "789",
  });
  const [selectedBank, setSelectedBank] = useState("HDFC");

  const dialogRef = useRef(null);
  const wasOpenRef = useRef(false);
  const previouslyFocusedElementRef = useRef(null);

  // Initialize only on open transition and manage focus lifecycle
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      previouslyFocusedElementRef.current = document.activeElement;
      setActiveTab(initialMethod);
      setErrorMessage(null);
      setIsProcessing(false);
      setProcessingStep(1);

      // Move focus inside the gateway on open
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 0);
    }
    wasOpenRef.current = isOpen;

    if (!isOpen && previouslyFocusedElementRef.current) {
      if (typeof previouslyFocusedElementRef.current.focus === "function") {
        previouslyFocusedElementRef.current.focus();
      }
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen, initialMethod]);

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

  // Keyboard navigation & dismissal listener with Tab trapping
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !isProcessing) {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable.length || isProcessing) {
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
  }, [isOpen, onClose, isProcessing]);

  if (!isOpen) return null;

  const handleCardChange = (field, value) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExecutePayment = async () => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStep(1);

    // Realistic multi-second simulated banking steps
    setTimeout(() => {
      setProcessingStep(2);
    }, 900);

    setTimeout(() => {
      setProcessingStep(3);
    }, 1800);

    setTimeout(async () => {
      try {
        const result = await onConfirm(outcomeSimulation);
        if (outcomeSimulation === "SUCCESS" && result) {
          onSuccess(result);
        } else {
          setErrorMessage(
            result?.message ||
              "Payment failed: Simulated card decline / insufficient funds. Transaction recorded as FAILED.",
          );
        }
      } catch (err) {
        setErrorMessage(err.message || "Simulated payment processing error.");
      } finally {
        setIsProcessing(false);
      }
    }, 2400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateway-heading"
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/75 backdrop-blur-sm animate-in fade-in duration-200 focus:outline-none"
    >
      <div className="bg-workspace-card border border-workspace-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Gateway Header */}
        <div className="bg-brand-dark text-text-inverted px-5 py-4 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-accent/20 text-emerald-accent flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="gateway-heading"
                  className="text-sm font-bold font-display text-text-inverted"
                >
                  GymPilot Secure Gateway
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Ref: {transactionReference}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
              Payable
            </span>
            <span className="text-base font-bold font-display text-emerald-accent">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {/* Payment Methods Tab Switcher */}
        <div className="flex border-b border-workspace-border bg-slate-50/75 p-1 text-xs">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setActiveTab("UPI")}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "UPI"
                ? "bg-workspace-card text-emerald-dark shadow-sm border border-workspace-border/80"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> UPI
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setActiveTab("CARD")}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "CARD"
                ? "bg-workspace-card text-emerald-dark shadow-sm border border-workspace-border/80"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Card
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setActiveTab("NET_BANKING")}
            className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "NET_BANKING"
                ? "bg-workspace-card text-emerald-dark shadow-sm border border-workspace-border/80"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Net Banking
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === "UPI" && (
            <UpiPaymentView amount={amount} vpa={vpa} onVpaChange={setVpa} />
          )}
          {activeTab === "CARD" && (
            <CardPaymentView
              cardData={cardData}
              onCardChange={handleCardChange}
            />
          )}
          {activeTab === "NET_BANKING" && (
            <NetBankingPaymentView
              selectedBank={selectedBank}
              onBankSelect={setSelectedBank}
            />
          )}

          {/* Test Outcome Simulator Control */}
          <div className="pt-2 border-t border-workspace-border">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted" /> Test
                  Scenario Outcome
                </span>
                <span className="text-[10px] text-text-muted">
                  Portfolio Sandbox
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setOutcomeSimulation("SUCCESS")}
                  className={`py-1.5 px-3 rounded-lg font-semibold border text-center transition-all ${
                    outcomeSimulation === "SUCCESS"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-300/40"
                      : "bg-white text-text-secondary border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  ✓ Test SUCCESS
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setOutcomeSimulation("FAILED")}
                  className={`py-1.5 px-3 rounded-lg font-semibold border text-center transition-all ${
                    outcomeSimulation === "FAILED"
                      ? "bg-red-50 text-red-800 border-red-300 ring-2 ring-red-300/40"
                      : "bg-white text-text-secondary border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  ✕ Test FAILURE
                </button>
              </div>
            </div>
          </div>

          {/* Error Message Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
              <div>
                <strong className="block">Payment Failed:</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Realistic Processing Indicator */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-brand-dark/95 text-text-inverted text-center space-y-2.5 animate-in fade-in">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-accent" />
              <div className="text-xs font-semibold">
                {processingStep === 1 &&
                  "Connecting to bank authentication servers..."}
                {processingStep === 2 &&
                  "Verifying payment authorization token..."}
                {processingStep === 3 &&
                  "Completing settlement with GymPilot ledger..."}
              </div>
              <p className="text-[10px] text-slate-400">
                Please do not refresh or close this window
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-workspace-border flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleExecutePayment}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Pay {formatCurrency(amount)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MockPaymentGatewayModal;
