import React from "react";
import { Building2, Check } from "lucide-react";

const POPULAR_BANKS = [
  { id: "HDFC", name: "HDFC Bank", short: "HDFC" },
  { id: "SBI", name: "State Bank of India", short: "SBI" },
  { id: "ICICI", name: "ICICI Bank", short: "ICICI" },
  { id: "AXIS", name: "Axis Bank", short: "AXIS" },
  { id: "KOTAK", name: "Kotak Mahindra", short: "KOTAK" },
  { id: "PNB", name: "Punjab National Bank", short: "PNB" },
];

/**
 * Simulated Net Banking View.
 *
 * @param {{
 *   selectedBank: string,
 *   onBankSelect: (bankId: string) => void
 * }} props
 */
export function NetBankingPaymentView({ selectedBank, onBankSelect }) {
  return (
    <div className="space-y-3 pt-1">
      <label className="text-xs font-semibold text-text-primary block">
        Select Your Bank
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {POPULAR_BANKS.map((bank) => {
          const isSelected = selectedBank === bank.id;
          return (
            <button
              key={bank.id}
              type="button"
              onClick={() => onBankSelect(bank.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                isSelected
                  ? "border-emerald-accent bg-emerald-50/60 ring-2 ring-emerald-accent/40 shadow-sm"
                  : "border-workspace-border bg-workspace hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Building2
                  className={`w-4 h-4 ${
                    isSelected ? "text-emerald-accent" : "text-text-muted"
                  }`}
                />
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-emerald-accent text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-text-primary leading-tight mt-1">
                {bank.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-1">
        <label className="text-[11px] font-semibold text-text-secondary block mb-1">
          Or Select All Other Banks
        </label>
        <select
          value={selectedBank}
          onChange={(e) => onBankSelect(e.target.value)}
          className="w-full text-xs px-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none"
        >
          <option value="">Select a Bank...</option>
          <option value="BOB">Bank of Baroda</option>
          <option value="CANARA">Canara Bank</option>
          <option value="IDBI">IDBI Bank</option>
          <option value="INDUSIND">IndusInd Bank</option>
          <option value="YES">Yes Bank</option>
          <option value="UNION">Union Bank of India</option>
        </select>
      </div>
    </div>
  );
}

export default NetBankingPaymentView;

