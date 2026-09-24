"use client";

import React, { useEffect } from "react";
import { toast } from "@/lib/toast";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Show error toast notification automatically
    toast.error(error?.message || "An unexpected error occurred in POS terminal.");
    console.error("Caught error in POS Error Boundary:", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error?.message || "A recoverable view error occurred. Your active cart and orders are preserved."}
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload POS Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
