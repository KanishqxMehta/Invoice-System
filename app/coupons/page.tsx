"use client";

import React, { useState, useEffect } from "react";
import { Coupon, DiscountType } from "@/lib/types";
import { getCoupons, saveCoupon, toggleCoupon } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import {
  Tag,
  Plus,
  Check,
  X,
  Calendar,
  AlertCircle,
  Percent,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Portal from "@/components/Portal";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("200");
  const [maxDiscount, setMaxDiscount] = useState("100");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setCoupons(getCoupons());
    const handleStorage = () => setCoupons(getCoupons());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!showCreateModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCreateModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal]);

  const handleToggle = (id: string) => {
    const updated = toggleCoupon(id);
    setCoupons(updated);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError("Coupon code is required");
      return;
    }

    const numVal = parseFloat(value);
    const numMin = parseFloat(minOrder) || 0;
    const numMax = maxDiscount ? parseFloat(maxDiscount) : undefined;

    if (isNaN(numVal) || numVal <= 0) {
      setFormError("Please enter a valid discount value");
      return;
    }

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      value: numVal,
      minOrder: numMin,
      maxDiscount: discountType === "PERCENT" ? numMax : undefined,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      isActive: true,
      timesUsed: 0,
      description:
        description.trim() ||
        (discountType === "PERCENT"
          ? `${numVal}% off up to ${numMax ? formatINR(numMax) : "unlimited"} on orders above ${formatINR(numMin)}`
          : `Flat ${formatINR(numVal)} off on orders above ${formatINR(numMin)}`),
    };

    saveCoupon(newCoupon);
    setCoupons(getCoupons());
    setShowCreateModal(false);

    // Reset
    setCode("");
    setValue("10");
    setMinOrder("200");
    setMaxDiscount("100");
    setDescription("");
    setFormError("");
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 space-y-6 min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <span>Coupons & Discount Engine</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure promotional promo codes, percent discounts, flat discounts, and caps
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const isExpired =
            coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
          return (
            <div
              key={coupon.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs ${
                coupon.isActive && !isExpired
                  ? "border-slate-200 dark:border-slate-800 hover:border-amber-500/60"
                  : "border-slate-200 dark:border-slate-800/50 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                      {coupon.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        coupon.isActive && !isExpired
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isExpired
                        ? "Expired"
                        : coupon.isActive
                        ? "Active"
                        : "Paused"}
                    </span>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(coupon.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                      coupon.isActive
                        ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50"
                    }`}
                  >
                    {coupon.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-medium">
                  {coupon.description}
                </p>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono">
                  <div className="flex justify-between">
                    <span>Discount Type:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {coupon.discountType === "PERCENT"
                        ? `${coupon.value}% Off`
                        : `${formatINR(coupon.value)} Flat`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Min Order Value:</span>
                    <span className="text-slate-900 dark:text-white">{formatINR(coupon.minOrder)}</span>
                  </div>

                  {coupon.maxDiscount && (
                    <div className="flex justify-between">
                      <span>Max Discount Cap:</span>
                      <span className="text-slate-900 dark:text-white">{formatINR(coupon.maxDiscount)}</span>
                    </div>
                  )}

                  {coupon.expiryDate && (
                    <div className="flex justify-between">
                      <span>Valid Till:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(coupon.expiryDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Redeemed {coupon.timesUsed} times</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-500/80 font-semibold">
                  Preview in POS Cart
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <Portal>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateModal(false);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
          >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-900 dark:text-white">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Create New Promo Coupon</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="create-coupon-form" onSubmit={handleCreateCoupon} className="space-y-4 px-6 py-5 flex-1 overflow-y-auto min-h-0">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-red-950/40 border border-rose-200 dark:border-red-800 text-rose-700 dark:text-red-400 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. MONSOON20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENT")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      discountType === "PERCENT"
                        ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("FLAT")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      discountType === "FLAT"
                        ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Flat Discount (₹)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Value {discountType === "PERCENT" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {discountType === "PERCENT" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150 (Leave blank for unlimited)"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-coupon-form"
                className="px-5 py-2 text-xs rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Create Coupon
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
