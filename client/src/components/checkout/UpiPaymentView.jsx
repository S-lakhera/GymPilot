import React, { useState } from "react";
import { QrCode, Smartphone, Copy, Check } from "lucide-react";

/**
 * Simulated UPI Payment View.
 *
 * @param {{
 *   amount: number,
 *   vpa: string,
 *   onVpaChange: (vpa: string) => void
 * }} props
 */
export function UpiPaymentView({ amount, vpa, onVpaChange }) {
  const [copied, setCopied] = useState(false);
  const sampleVpa = "gympilot.pay@upi";

  const handleCopy = () => {
    navigator.clipboard?.writeText(sampleVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Dynamic Simulated QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-workspace-border rounded-xl text-center">
          <div className="w-32 h-32 bg-white p-2 rounded-lg border border-slate-200 shadow-inner flex items-center justify-center">
            {/* Athletic Styled SVG QR Code Matrix */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-slate-800"
              fill="currentColor"
              aria-label="Simulated UPI QR Code"
            >
              {/* Corner Position Detection Squares */}
              <rect x="5" y="5" width="26" height="26" rx="3" fill="currentColor" />
              <rect x="9" y="9" width="18" height="18" fill="white" />
              <rect x="13" y="13" width="10" height="10" fill="currentColor" />

              <rect x="69" y="5" width="26" height="26" rx="3" fill="currentColor" />
              <rect x="73" y="9" width="18" height="18" fill="white" />
              <rect x="77" y="13" width="10" height="10" fill="currentColor" />

              <rect x="5" y="69" width="26" height="26" rx="3" fill="currentColor" />
              <rect x="9" y="73" width="18" height="18" fill="white" />
              <rect x="13" y="77" width="10" height="10" fill="currentColor" />

              {/* Data Dots Pattern */}
              <circle cx="45" cy="18" r="4" />
              <circle cx="55" cy="18" r="3" />
              <circle cx="40" cy="35" r="3" />
              <circle cx="50" cy="45" r="4" />
              <circle cx="60" cy="40" r="3" />
              <circle cx="45" cy="55" r="4" />
              <circle cx="75" cy="50" r="3" />
              <circle cx="85" cy="65" r="4" />
              <circle cx="35" cy="75" r="3" />
              <circle cx="48" cy="80" r="4" />
              <circle cx="65" cy="75" r="4" />
              <circle cx="80" cy="85" r="3" />
            </svg>
          </div>
          <span className="text-[11px] font-medium text-text-secondary mt-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-emerald-accent" /> Scan with any UPI App
          </span>
        </div>

        {/* VPA Handle Option */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Virtual Payment Address (VPA / UPI ID)
            </label>
            <div className="relative">
              <input
                type="text"
                value={vpa}
                onChange={(e) => onVpaChange(e.target.value)}
                placeholder="e.g. member@okhdfcbank"
                className="w-full text-xs px-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none"
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Supports Google Pay, PhonePe, Paytm, or BHIM.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-accent" />
              <span className="text-text-secondary">Gym UPI ID:</span>
              <strong className="text-text-primary">{sampleVpa}</strong>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-emerald-dark hover:text-emerald-accent p-1 transition-colors"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpiPaymentView;

