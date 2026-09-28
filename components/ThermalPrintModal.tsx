"use client";

import React, { useState, useEffect } from "react";
import { Order, KOTTicket, CafeSettings } from "@/lib/types";
import ThermalReceipt80mm from "./ThermalReceipt80mm";
import ThermalKOT58mm from "./ThermalKOT58mm";
import WhatsAppIcon from "./WhatsAppIcon";
import { dispatchWhatsAppViaWeb, getAppBaseUrl } from "@/lib/notifications";
import { Printer, X, CheckCircle2, ExternalLink, Copy, Check } from "lucide-react";
import Link from "next/link";
import Portal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  kot: KOTTicket;
  settings: CafeSettings;
  autoPrintReceipt?: boolean;
}

export default function ThermalPrintModal({
  isOpen,
  onClose,
  order,
  kot,
  settings,
}: Props) {
  const [activeTab, setActiveTab] = useState<"both" | "receipt" | "kot">("both");
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(order.customerPhone || "");
  const [whatsappSent, setWhatsappSent] = useState(false);

  useEffect(() => {
    setPhone(order.customerPhone || "");
  }, [order]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = (type: "both" | "receipt" | "kot") => {
    setActiveTab(type);
    // Short delay to ensure DOM update before invoking browser print dialog
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSendWhatsApp = () => {
    const result = dispatchWhatsAppViaWeb({
      order,
      settings,
      baseUrl: getAppBaseUrl(),
      phoneOverride: phone,
    });

    if (result.success) {
      setWhatsappSent(true);
      setTimeout(() => setWhatsappSent(false), 3000);
    }
  };

  const billPath = `/bill/${order.id}`;

  const copyBillUrl = () => {
    const fullUrl = `${getAppBaseUrl()}${billPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Hidden container dedicated strictly for window.print() */}
      <div id="printable-receipt" className="hidden print:block">
        {(activeTab === "both" || activeTab === "receipt") && (
          <div className="mb-8 print:mb-8">
            <ThermalReceipt80mm order={order} settings={settings} />
          </div>
        )}
        {(activeTab === "both" || activeTab === "kot") && (
          <div className="print:break-before-page">
            <ThermalKOT58mm ticket={kot} />
          </div>
        )}
      </div>

      {/* Screen Overlay Modal */}
      <Portal>
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto no-print animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] animate-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Order Placed: #{order.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    {kot.kotNumber}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready for thermal printing &amp; 1-click WhatsApp customer dispatch
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
            {/* Tab Selector */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab("both")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "both"
                    ? "bg-amber-600 text-white shadow-sm font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Both Tickets
              </button>
              <button
                onClick={() => setActiveTab("receipt")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "receipt"
                    ? "bg-amber-600 text-white shadow-sm font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                80mm Receipt
              </button>
              <button
                onClick={() => setActiveTab("kot")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "kot"
                    ? "bg-amber-600 text-white shadow-sm font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                58mm Kitchen KOT
              </button>
            </div>

            {/* WhatsApp 1-Click Dispatch & Print Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp Quick Dispatch Group */}
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1.5 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Customer Phone"
                  className="w-32 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  whatsappSent
                    ? "bg-emerald-700 text-white"
                    : "bg-[#25D366] hover:bg-[#20ba59] text-white"
                }`}
                title="Send receipt via WhatsApp Web (100% Free)"
              >
                {whatsappSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Sent / Opened!</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>Send WhatsApp</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handlePrint(activeTab)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print {activeTab === "both" ? "Both" : activeTab === "receipt" ? "80mm Receipt" : "58mm KOT"}</span>
              </button>
            </div>
          </div>

          {/* Ticket Previews Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/40 flex justify-center items-start gap-8">
            {/* 80mm Customer Bill Preview */}
            {(activeTab === "both" || activeTab === "receipt") && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  80mm Customer Receipt
                </div>
                <div className="w-full max-w-[340px] bg-white text-black p-5 rounded-none shadow-xl border border-slate-300 font-mono select-text flex-shrink-0">
                  <ThermalReceipt80mm order={order} settings={settings} />
                </div>
              </div>
            )}

            {/* 58mm Kitchen Ticket Preview */}
            {(activeTab === "both" || activeTab === "kot") && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  58mm Kitchen KOT
                </div>
                <div className="w-full max-w-[280px] bg-white text-black p-4 rounded-none shadow-xl border border-slate-300 font-mono select-none flex-shrink-0">
                  <ThermalKOT58mm ticket={kot} />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer with Digital Bill link & WhatsApp Shortcut */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">Digital Bill Link:</span>
              <span className="text-xs font-mono bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                {billPath}
              </span>
              <button
                onClick={copyBillUrl}
                className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
              <Link
                href={billPath}
                target="_blank"
                className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Bill</span>
              </Link>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 hover:underline font-semibold cursor-pointer ml-1"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Done / Back to POS
            </button>
          </div>
        </div>
      </div>
      </Portal>
    </>
  );
}
