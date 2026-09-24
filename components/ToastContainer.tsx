"use client";

import React, { useState, useEffect } from "react";
import { ToastPayload } from "@/lib/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import Portal from "./Portal";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (!customEvent.detail) return;

      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      const duration = newToast.duration ?? 3500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    };

    window.addEventListener("app-toast", handleToastEvent);
    return () => window.removeEventListener("app-toast", handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <Portal>
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print"
      >
        {toasts.map((t) => {
          let bgClasses = "bg-slate-900/95 border-slate-700 text-white";
          let icon = <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />;

          if (t.type === "success") {
            bgClasses =
              "bg-emerald-700/95 border-emerald-500/50 text-white shadow-emerald-950/40";
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />;
          } else if (t.type === "error") {
            bgClasses = "bg-rose-700/95 border-rose-500/50 text-white shadow-rose-950/40";
            icon = <AlertCircle className="w-4 h-4 text-rose-200 flex-shrink-0" />;
          } else if (t.type === "warning") {
            bgClasses = "bg-amber-600/95 border-amber-400/50 text-white shadow-amber-950/40";
            icon = <AlertTriangle className="w-4 h-4 text-amber-200 flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium animate-in slide-in-from-top-3 fade-in duration-200 transition-all ${bgClasses}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <span className="leading-snug break-words">{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-white/70 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Portal>
  );
}
