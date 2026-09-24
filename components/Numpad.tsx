"use client";

import React from "react";
import { Delete, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onApply?: () => void;
  onClose?: () => void;
  quickQuantities?: number[];
}

export default function Numpad({
  value,
  onChange,
  onApply,
  onClose,
  quickQuantities = [1, 2, 3, 4, 5],
}: Props) {
  const handleDigit = (digit: string) => {
    if (value === "0" || value === "") {
      onChange(digit);
    } else {
      onChange(value + digit);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-slate-900 dark:text-white select-none shadow-xs">
      {/* Quick Quantities Bar */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {quickQuantities.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(q.toString())}
            className="py-1.5 rounded-lg font-mono font-bold text-xs bg-slate-100 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
          >
            x{q}
          </button>
        ))}
      </div>

      {/* Digits Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "⌫"].map(
          (key) => {
            if (key === "C") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 rounded-xl font-bold text-sm bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 active:scale-95 transition-all border border-rose-200 dark:border-rose-900/50"
                >
                  CLR
                </button>
              );
            }
            if (key === "⌫") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                >
                  <Delete className="w-4 h-4" />
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDigit(key)}
                className="py-2.5 rounded-xl font-mono font-bold text-base bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-xs"
              >
                {key}
              </button>
            );
          }
        )}
      </div>

      {(onApply || onClose) && (
        <div className="mt-2 flex items-center gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
          )}
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 text-white shadow-md active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Set Qty</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
