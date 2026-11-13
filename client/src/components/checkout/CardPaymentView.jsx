import React from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";

/**
 * Simulated Debit/Credit Card Payment View.
 *
 * @param {{
 *   cardData: {
 *     cardNumber: string,
 *     cardHolder: string,
 *     expiry: string,
 *     cvv: string
 *   },
 *   onCardChange: (field: string, value: string) => void
 * }} props
 */
export function CardPaymentView({ cardData, onCardChange }) {
  const handleCardNumberChange = (e) => {
    // Only digits, maximum 16 digits, auto-spaced every 4
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ");
    onCardChange("cardNumber", formatted);
  };

  const handleExpiryChange = (e) => {
    // MM/YY format
    const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) {
      onCardChange("expiry", `${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      onCardChange("expiry", clean);
    }
  };

  const handleCvvChange = (e) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 3);
    onCardChange("cvv", clean);
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Card Visual Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-tr from-brand-dark to-slate-800 text-text-inverted shadow-md relative overflow-hidden border border-brand-border">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider">
            Debit / Credit Card
          </span>
          <CreditCard className="w-5 h-5 text-emerald-accent" />
        </div>
        <div className="mt-4 font-mono text-base tracking-widest text-emerald-300">
          {cardData.cardNumber || "•••• •••• •••• ••••"}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Cardholder
            </div>
            <div className="font-semibold text-slate-200 uppercase truncate max-w-[150px]">
              {cardData.cardHolder || "YOUR NAME"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Expires
            </div>
            <div className="font-mono text-slate-200">
              {cardData.expiry || "MM/YY"}
            </div>
          </div>
        </div>
      </div>

      {/* Card Inputs */}
      <div className="space-y-2.5">
        <div>
          <label htmlFor="card-number-input" className="text-[11px] font-semibold text-text-primary block mb-1">
            Card Number
          </label>
          <div className="relative">
            <input
              id="card-number-input"
              type="text"
              value={cardData.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4532 8920 1234 5678"
              className="w-full text-xs px-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary font-mono focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none"
            />
            <CreditCard className="w-4 h-4 text-text-muted absolute right-3 top-2.5" />
          </div>
        </div>

        <div>
          <label htmlFor="card-holder-input" className="text-[11px] font-semibold text-text-primary block mb-1">
            Cardholder Name
          </label>
          <input
            id="card-holder-input"
            type="text"
            value={cardData.cardHolder}
            onChange={(e) =>
              onCardChange("cardHolder", e.target.value.toUpperCase())
            }
            placeholder="NAME ON CARD"
            className="w-full text-xs px-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary uppercase focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="card-expiry-input" className="text-[11px] font-semibold text-text-primary block mb-1">
              Valid Thru
            </label>
            <input
              id="card-expiry-input"
              type="text"
              value={cardData.expiry}
              onChange={handleExpiryChange}
              placeholder="MM/YY"
              className="w-full text-xs px-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary font-mono focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="card-cvv-input" className="text-[11px] font-semibold text-text-primary block mb-1">
              CVV / CVC
            </label>
            <div className="relative">
              <input
                id="card-cvv-input"
                type="password"
                value={cardData.cvv}
                onChange={handleCvvChange}
                placeholder="•••"
                maxLength={3}
                className="w-full text-xs px-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary font-mono focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-text-muted absolute right-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-text-muted flex items-center gap-1.5 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-accent" /> Simulated
        256-bit bank encryption. Test card details accepted.
      </p>
    </div>
  );
}

export default CardPaymentView;
