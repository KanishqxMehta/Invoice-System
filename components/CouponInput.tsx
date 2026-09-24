"use client";

import React, { useState } from "react";
import { Coupon, CafeSettings } from "@/lib/types";
import { getCouponByCode } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import { Tag, Check, X, AlertCircle, ChevronUp } from "lucide-react";

interface Props {
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
  onRemoveCoupon?: () => void;
  subtotal: number;
  settings?: CafeSettings;
}

export default function CouponInput({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  subtotal,
  settings,
}: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    const coupon = getCouponByCode(code.trim());
    if (!coupon) {
      setError("Invalid promo code");
      return;
    }

    if (!coupon.isActive) {
      setError("This coupon is currently inactive");
      return;
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      setError("This coupon has expired");
      return;
    }

    if (subtotal < coupon.minOrder) {
      setError(`Min order of ${formatINR(coupon.minOrder)} required`);
      return;
    }

    onApplyCoupon(coupon);
    setError(null);
    setCode("");
    setIsExpanded(false);
  };

  const handleRemove = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon();
    } else {
      onApplyCoupon(null);
    }
    setError(null);
    setIsExpanded(false);
  };

  // 1. If coupon is applied: Show sleek compact applied pill
  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl shadow-2xs animate-in fade-in duration-150">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
            %
          </div>
          <div className="min-w-0">
            <div className="font-mono font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <span>{appliedCoupon.code}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800/60">
                {appliedCoupon.discountType === "PERCENT" ? `${appliedCoupon.value}% OFF` : `-${formatINR(appliedCoupon.value)}`}
              </span>
            </div>
            {appliedCoupon.description && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {appliedCoupon.description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
          title="Remove Promo Code"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 2. If collapsed (not expanded): Show slim, space-saving trigger
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/60 bg-white dark:bg-slate-900/70 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs transition-all group shadow-2xs"
        title="Click to apply promo code or discount voucher"
      >
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          <span className="font-medium text-[11px]">Have a promo / coupon code?</span>
        </div>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50 group-hover:bg-amber-500 group-hover:text-white transition-all">
          Enter Code ▾
        </span>
      </button>
    );
  }

  // 3. If expanded: Show full input box with quick chips and a hide button
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-slate-900 dark:text-white shadow-xs animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Tag className="w-3.5 h-3.5" />
          <span>Promo / Coupon</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick chip hints */}
          <div className="flex items-center gap-1 text-[10px]">
            {["FIRST50", "WELCOME10"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCode(c);
                  const coup = getCouponByCode(c);
                  if (coup) {
                    onApplyCoupon(coup);
                    setIsExpanded(false);
                  }
                }}
                className="font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Hide / Collapse button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setError(null);
            }}
            className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            title="Hide coupon section"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Hide</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleApply} className="flex gap-1.5">
        <input
          type="text"
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          autoFocus
          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm"
        >
          Apply
        </button>
      </form>

      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
