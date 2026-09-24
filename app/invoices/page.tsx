"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Order, SalesSummary } from "@/lib/types";
import { getOrders, deleteOrder, getSalesSummary, getSettings, DEFAULT_CAFE_SETTINGS } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import {
  Search,
  Trash2,
  Receipt,
  Bike,
  Utensils,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Eye,
  X,
  Printer,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import ThermalReceipt80mm from "@/components/ThermalReceipt80mm";
import ConfirmModal from "@/components/ConfirmModal";
import Portal from "@/components/Portal";

export default function InvoicesAndSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    inStoreSales: 0,
    inStoreOrderCount: 0,
    zomatoEarnings: 0,
    zomatoOrderCount: 0,
    b2bInvoiced: 0,
    b2bInvoiceCount: 0,
    grossCombinedTotal: 0,
    totalTransactions: 0,
  });

  // Receipts tab filters
  const [receiptSearch, setReceiptSearch] = useState("");
  const [receiptTypeFilter, setReceiptTypeFilter] = useState<string>("ALL");

  // In-page quick modal receipt preview
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [modalViewMode, setModalViewMode] = useState<"printed" | "digital">("printed");
  const [copied, setCopied] = useState(false);

  // Custom confirmation modal target for deleting receipt
  const [deleteReceiptTarget, setDeleteReceiptTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const [settings, setSettings] = useState(DEFAULT_CAFE_SETTINGS);

  const loadData = () => {
    setOrders(getOrders());
    setSalesSummary(getSalesSummary());
    setSettings(getSettings());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  // Escape key closes modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewOrder) setPreviewOrder(null);
        if (deleteReceiptTarget) setDeleteReceiptTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOrder, deleteReceiptTarget]);

  const requestDeleteReceipt = (id: string, orderNumber: string, zomatoId?: string) => {
    const label = zomatoId ? `Zomato Order #${orderNumber} (${zomatoId})` : `Order #${orderNumber}`;
    setDeleteReceiptTarget({ id, label });
  };

  const confirmDeleteReceipt = () => {
    if (!deleteReceiptTarget) return;
    const updated = deleteOrder(deleteReceiptTarget.id);
    setOrders(updated);
    setSalesSummary(getSalesSummary());
    window.dispatchEvent(new Event("storage"));
    setDeleteReceiptTarget(null);
  };

  const handleShare = () => {
    if (!previewOrder) return;
    const url = `${window.location.origin}/bill/${previewOrder.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered Orders / Receipts
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const isZomato =
        order.isZomatoOrder ??
        (order.orderType === "DELIVERY" ||
          order.paymentMethod === "ZOMATO" ||
          !!order.zomatoOrderId);

      if (receiptTypeFilter === "DINE_IN" && order.orderType !== "DINE_IN") return false;
      if (receiptTypeFilter === "TAKEAWAY" && order.orderType !== "TAKEAWAY") return false;
      if (receiptTypeFilter === "ZOMATO" && !isZomato) return false;
      if (receiptTypeFilter === "IN_STORE" && isZomato) return false;

      if (receiptSearch.trim()) {
        const q = receiptSearch.toLowerCase();
        const matchesNum = order.orderNumber.toLowerCase().includes(q);
        const matchesZomato = order.zomatoOrderId?.toLowerCase().includes(q);
        const matchesCust = order.customerName?.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone?.includes(q);
        const matchesTable = order.tableNumber?.toLowerCase().includes(q);
        const matchesItem = order.items.some((i) => i.name.toLowerCase().includes(q));
        return matchesNum || matchesZomato || matchesCust || matchesPhone || matchesTable || matchesItem;
      }
      return true;
    });
  }, [orders, receiptTypeFilter, receiptSearch]);

  const totalCombinedSales = salesSummary.inStoreSales + salesSummary.zomatoEarnings;
  const totalCompletedOrders = salesSummary.inStoreOrderCount + salesSummary.zomatoOrderCount;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-6 space-y-6 overflow-y-auto">
      {/* Hidden printable receipt for browser window.print() inside modal */}
      {previewOrder && (
        <div id="printable-receipt" className="hidden print:block">
          <ThermalReceipt80mm order={previewOrder} settings={settings} />
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <span>Sales &amp; Receipts Register</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track in-store counter receipts (Dine-in, Takeaway) and Zomato online delivery orders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pos"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-xs"
          >
            ← Cashier POS
          </Link>
        </div>
      </div>

      {/* 4-Column High-Visibility Sales & Earnings Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: In-Store POS Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              🏬 In-Store Sales (POS)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(salesSummary.inStoreSales)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Dine-In &amp; Takeaway ({salesSummary.inStoreOrderCount} receipts)
          </span>
        </div>

        {/* Card 2: Zomato Delivery Earnings */}
        <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/60 p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <span>🛵 Zomato Delivery</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-300 dark:border-red-800">
                Online
              </span>
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {formatINR(salesSummary.zomatoEarnings)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Platform settled ({salesSummary.zomatoOrderCount} orders)
          </span>
        </div>

        {/* Card 3: Combined Total Revenue */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Combined Total Sales</span>
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-white mt-2">
            {formatINR(totalCombinedSales)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            In-Store POS + Zomato Delivery
          </span>
        </div>

        {/* Card 4: Total Transactions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              🧾 Total Orders Count
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalCompletedOrders}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Completed transactions recorded
          </span>
        </div>
      </div>

      {/* Main Receipts Register Section */}
      <div className="space-y-4">
        {/* Search & Channel Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search receipt #, Zomato ID, table, phone..."
              value={receiptSearch}
              onChange={(e) => setReceiptSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {[
              { id: "ALL", label: `All Receipts (${orders.length})` },
              { id: "IN_STORE", label: "🏬 In-Store" },
              { id: "DINE_IN", label: "🍽️ Dine-In" },
              { id: "TAKEAWAY", label: "🛍️ Takeaway" },
              { id: "ZOMATO", label: "🛵 Zomato Delivery" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReceiptTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  receiptTypeFilter === tab.id
                    ? tab.id === "ZOMATO"
                      ? "bg-red-600 text-white font-bold shadow-xs"
                      : "bg-amber-600 text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Order / Receipt #</th>
                  <th className="px-5 py-3.5">Channel / Type</th>
                  <th className="px-5 py-3.5">Date &amp; Time</th>
                  <th className="px-5 py-3.5">Customer / Table</th>
                  <th className="px-5 py-3.5">Items Summary</th>
                  <th className="px-5 py-3.5">Tax (GST)</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No receipts found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const isZomato =
                      ord.isZomatoOrder ??
                      (ord.orderType === "DELIVERY" ||
                        ord.paymentMethod === "ZOMATO" ||
                        !!ord.zomatoOrderId);

                    return (
                      <tr
                        key={ord.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isZomato ? "bg-red-500/[0.02]" : ""
                        }`}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div>#{ord.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            KOT: #{ord.kotNumber}
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {isZomato ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-mono">
                              <Bike className="w-3 h-3" />
                              <span>{ord.zomatoOrderId || "ZOMATO"}</span>
                            </span>
                          ) : ord.orderType === "DINE_IN" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                              <Utensils className="w-3 h-3" />
                              <span>Dine-In</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                              <ShoppingBag className="w-3 h-3" />
                              <span>Takeaway</span>
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div>
                            {new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {ord.customerName || (isZomato ? "Zomato Customer" : "Walk-in Guest")}
                          </div>
                          {ord.tableNumber && (
                            <div className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                              Table: {ord.tableNumber}
                            </div>
                          )}
                          {ord.customerPhone && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {ord.customerPhone}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                        </td>

                        <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400">
                          {formatINR(ord.taxAmount)}
                        </td>

                        <td className="px-5 py-4 font-mono font-bold text-sm whitespace-nowrap">
                          <span className={isZomato ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}>
                            {formatINR(ord.finalTotal)}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {isZomato ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                              PAID (Zomato)
                            </span>
                          ) : ord.paymentStatus === "PAID" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              PAID ({ord.paymentMethod})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              PENDING (Tab)
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Modal Button (Open modal with print and share) */}
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewOrder(ord);
                                setModalViewMode("printed");
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/80 transition-colors shadow-2xs cursor-pointer"
                              title="Preview & Print Receipt"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => requestDeleteReceipt(ord.id, ord.orderNumber, ord.zomatoOrderId)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK RECEIPT PREVIEW MODAL WITH PRINT & SHARE OPTIONS */}
      {previewOrder && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewOrder(null);
            }}
          >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Receipt #{previewOrder.orderNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-mono">
                      {previewOrder.kotNumber}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customer receipt preview &amp; print dispatch
                  </p>
                </div>
              </div>

              {/* Share, Print & Close Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Copy customer receipt link"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Link Copied!" : "Share"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Print receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewOrder(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="px-6 py-2.5 bg-slate-50/60 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setModalViewMode("printed")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modalViewMode === "printed"
                      ? "bg-amber-600 text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Printed Receipt (80mm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalViewMode("digital")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modalViewMode === "digital"
                      ? "bg-amber-600 text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Digital Bill</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {modalViewMode === "printed" ? "80mm Thermal Slip" : "Digital Bill View"}
              </div>
            </div>

            {/* Modal Body with Guaranteed Scrolling */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start bg-slate-100 dark:bg-slate-950/60">
              {modalViewMode === "printed" ? (
                /* Normal Receipt with Sharp Corners Only (rounded-none, straight paper edges, clean padding) */
                <div className="w-full max-w-[340px] bg-white text-black p-5 sm:p-6 rounded-none shadow-2xl border border-slate-300 font-mono select-text flex-shrink-0 my-auto sm:my-3">
                  <ThermalReceipt80mm order={previewOrder} settings={settings} />
                </div>
              ) : (
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex-shrink-0 my-auto sm:my-3">
                  {/* Top Decorative Cafe Header */}
                  <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-6 text-center">
                    <h3 className="text-xl font-black">{settings.cafeName}</h3>
                    <p className="text-xs text-amber-200/90">{settings.tagline}</p>
                    <p className="text-[11px] text-amber-100/70 mt-1">{settings.address}</p>
                  </div>

                  {/* Payment status */}
                  <div className="bg-emerald-50 border-y border-emerald-100 px-6 py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900">
                      PAID via {previewOrder.paymentMethod}
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatINR(previewOrder.finalTotal)}
                    </span>
                  </div>

                  {/* Order metadata */}
                  <div className="p-5 border-b border-dashed border-slate-200 text-xs space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span>Order #: <strong>#{previewOrder.orderNumber}</strong></span>
                      <span>KOT: <strong className="text-amber-700">{previewOrder.kotNumber}</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Type:{" "}
                        <strong className={previewOrder.isZomatoOrder ? "text-rose-600 font-bold" : ""}>
                          {previewOrder.isZomatoOrder
                            ? `ZOMATO DELIVERY (${previewOrder.zomatoOrderId || "Online"})`
                            : previewOrder.orderType}
                        </strong>
                      </span>
                      {previewOrder.tableNumber && (
                        <span>Table: <strong>{previewOrder.tableNumber}</strong></span>
                      )}
                    </div>
                    {previewOrder.customerName && (
                      <div className="text-slate-500">
                        Customer: {previewOrder.customerName} ({previewOrder.customerPhone})
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="p-5 border-b border-dashed border-slate-200 text-xs space-y-2">
                    {previewOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-800">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono font-bold">{formatINR(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Total */}
                  <div className="p-5 bg-slate-50 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatINR(previewOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Tax (GST):</span>
                      <span className="font-mono">{formatINR(previewOrder.taxAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                      <span>Net Total:</span>
                      <span className="font-mono text-base text-amber-700">
                        {formatINR(previewOrder.finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Receipt #{previewOrder.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Custom Confirmation Modal for Deleting Receipt */}
      <ConfirmModal
        isOpen={Boolean(deleteReceiptTarget)}
        onClose={() => setDeleteReceiptTarget(null)}
        onConfirm={confirmDeleteReceipt}
        title="Delete Receipt Record"
        description={`Are you sure you want to delete ${deleteReceiptTarget?.label}? This action will permanently remove it from the sales register.`}
        confirmText="Delete Record"
        cancelText="Keep Record"
        variant="danger"
      />
    </div>
  );
}
