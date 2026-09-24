"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Check, RotateCcw, Gift, Percent, Calculator } from "lucide-react";
import { formatINR } from "@/lib/calculator";
import Portal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  orderTotal: number;
  defaultPercent: number;
  currentPercent: number | null;
  currentFixedPoints: number | null;
  onApplyRate: (percent: number | null, fixedPoints: number | null) => void;
}

export default function LoyaltyAwardModal({
  isOpen,
  onClose,
  customerName,
  orderTotal,
  defaultPercent,
  currentPercent,
  currentFixedPoints,
  onApplyRate,
}: Props) {
  const [mode, setMode] = useState<"PERCENTAGE" | "FIXED">(
    currentFixedPoints !== null ? "FIXED" : "PERCENTAGE"
  );
  const [percentInput, setPercentInput] = useState<string>(
    currentPercent !== null ? currentPercent.toString() : defaultPercent.toString()
  );
  const [fixedPointsInput, setFixedPointsInput] = useState<string>(
    currentFixedPoints !== null ? currentFixedPoints.toString() : ""
  );

  useEffect(() => {
    if (isOpen) {
      if (currentFixedPoints !== null) {
        setMode("FIXED");
        setFixedPointsInput(currentFixedPoints.toString());
        setPercentInput(defaultPercent.toString());
      } else {
        setMode("PERCENTAGE");
        setPercentInput(
          currentPercent !== null ? currentPercent.toString() : defaultPercent.toString()
        );
        setFixedPointsInput("");
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, currentPercent, currentFixedPoints, defaultPercent, onClose]);

  if (!isOpen) return null;

  // Preset quick chips
  const quickPercents = [0, 2, 5, 8, 10, 15];

  // Calculated preview
  let previewPoints = 0;
  if (mode === "PERCENTAGE") {
    const num = parseFloat(percentInput) || 0;
    previewPoints = Math.max(0, Math.round((orderTotal * num) / 100));
  } else {
    previewPoints = Math.max(0, parseInt(fixedPointsInput, 10) || 0);
  }

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mode === "FIXED") {
      const pts = parseInt(fixedPointsInput, 10);
      if (!isNaN(pts) && pts >= 0) {
        onApplyRate(null, pts);
      } else {
        onApplyRate(null, 0);
      }
    } else {
      const pct = parseFloat(percentInput);
      if (!isNaN(pct) && pct >= 0) {
        onApplyRate(pct, null);
      } else {
        onApplyRate(defaultPercent, null);
      }
    }
    onClose();
  };

  const handleReset = () => {
    setMode("PERCENTAGE");
    setPercentInput(defaultPercent.toString());
    setFixedPointsInput("");
    onApplyRate(null, null); // Clear overrides, fall back to default
    onClose();
  };

  return (
    <Portal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
      >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-white animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Loyalty Points Award</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono border border-amber-300 dark:border-amber-500/30">
                Cashier Setting
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Award to <span className="text-amber-700 dark:text-amber-300 font-semibold">{customerName}</span> for this order
            </p>
          </div>
        </div>

        {/* Current Order Total Card */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Order Purchase Total:</div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {formatINR(orderTotal)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Points to Award:</div>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>+{previewPoints}</span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-normal">pts</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold mb-4">
          <button
            type="button"
            onClick={() => setMode("PERCENTAGE")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              mode === "PERCENTAGE"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Percentage of Purchase (%)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("FIXED")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              mode === "FIXED"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Fixed Point Bonus (pts)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="space-y-4">
          {mode === "PERCENTAGE" ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Quick Percentage:
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {quickPercents.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setPercentInput(pct.toString())}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 border ${
                        percentInput === pct.toString()
                          ? "bg-amber-500 text-white shadow-md border-amber-500 ring-2 ring-amber-400"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Or Custom Percentage:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    placeholder="e.g. 7.5"
                    value={percentInput}
                    onChange={(e) => setPercentInput(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">
                    %
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Exact Points to Award:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  placeholder="e.g. 50"
                  value={fixedPointsInput}
                  onChange={(e) => setFixedPointsInput(e.target.value)}
                  className="w-full pl-3 pr-12 py-2 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">
                  pts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Awards a flat promotional reward regardless of bill total (e.g. 100 points welcome treat).
              </p>
            </div>
          )}

          {/* Explanation Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span>
              Customer will receive <strong className="text-amber-700 dark:text-amber-300">{previewPoints} points</strong> upon payment. Worth <strong className="text-slate-900 dark:text-white">{formatINR(previewPoints)}</strong> off their future orders.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default ({defaultPercent}%)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Points</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
