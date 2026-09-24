"use client";

import React, { useState, useEffect } from "react";
import { CartItem, Customer, Coupon, OrderType, PaymentMethod, CafeSettings } from "@/lib/types";
import { BillCalculationResult, formatINR } from "@/lib/calculator";
import {
  X,
  Printer,
  FileText,
  QrCode,
  CheckCircle2,
  Coffee,
  Store,
  Eye,
  Check,
  Smartphone,
} from "lucide-react";
import Portal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer | null;
  appliedCoupon: Coupon | null;
  calculation: BillCalculationResult;
  orderType: OrderType;
  tableNumber?: string;
  zomatoOrderId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  settings: CafeSettings;
  onConfirmPunchAndPrint: () => void;
}

export default function BillerInvoicePreviewModal({
  isOpen,
  onClose,
  cart,
  customer,
  appliedCoupon,
  calculation,
  orderType,
  tableNumber,
  zomatoOrderId,
  paymentMethod,
  notes,
  settings,
  onConfirmPunchAndPrint,
}: Props) {
  const [viewMode, setViewMode] = useState<"digital" | "thermal">("digital");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const orderNumberPreview = "ORD-PREVIEW";
  const kotNumberPreview = "KOT-PREVIEW";

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.upiPayeeName
  )}&am=${calculation.finalTotal.toFixed(2)}&cu=INR&tn=Bill_PREVIEW`;

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiIntentUrl
  )}&margin=8`;

  const handlePunchFromPreview = () => {
    onClose();
    onConfirmPunchAndPrint();
  };

  return (
    <Portal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
      >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Biller Live Invoice Preview</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-mono">
                  Review Mode
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect items, GST breakdown, customer loyalty, and UPI QR before punching
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Bar */}
        <div className="px-6 py-2.5 bg-slate-50/60 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("digital")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "digital"
                  ? "bg-amber-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tax Invoice / Digital Bill
            </button>
            <button
              type="button"
              onClick={() => setViewMode("thermal")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "thermal"
                  ? "bg-amber-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              80mm Thermal Receipt
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Mode: <strong className="text-amber-700 dark:text-amber-400">{orderType}</strong>
            {orderType === "DELIVERY" && zomatoOrderId && (
              <span className="ml-2 text-red-600 dark:text-red-400">[Zomato: #{zomatoOrderId}]</span>
            )}
            {orderType === "DINE_IN" && tableNumber && (
              <span className="ml-2 text-amber-700 dark:text-amber-300">[{tableNumber}]</span>
            )}
          </div>
        </div>

        {/* Preview Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center items-start">
          {viewMode === "digital" ? (
            /* Digital Tax Invoice View */
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-200">
              {/* Cafe Header */}
              <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-5 text-center">
                <h3 className="font-black text-lg tracking-tight">{settings.cafeName}</h3>
                <p className="text-xs text-amber-200">{settings.tagline}</p>
                <p className="text-[10px] text-amber-100/70 mt-1">{settings.address}</p>
                <p className="text-[10px] text-amber-100/70">
                  GSTIN: {settings.gstNumber} | FSSAI: {settings.fssaiNumber}
                </p>
              </div>

              {/* Order Meta */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Invoice Draft: #{orderNumberPreview}</span>
                  <span className="text-amber-700">KOT: #{kotNumberPreview}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Date: {new Date().toLocaleDateString("en-IN")}</span>
                  <span>Type: <strong>{orderType === "DELIVERY" ? "Zomato Delivery" : orderType}</strong></span>
                </div>
                {orderType === "DELIVERY" && zomatoOrderId && (
                  <div className="text-red-700 font-bold text-[11px] bg-red-50 p-1 rounded border border-red-200">
                    Zomato Order ID: #{zomatoOrderId}
                  </div>
                )}
                {customer && (
                  <div className="text-slate-700 pt-1 border-t border-slate-200 flex justify-between">
                    <span>Customer: {customer.name}</span>
                    <span className="font-mono">{customer.phone}</span>
                  </div>
                )}
              </div>

              {/* Itemized Table */}
              <div className="p-4 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200">
                  <span className="w-7/12">Item</span>
                  <span className="w-2/12 text-center">Qty</span>
                  <span className="w-3/12 text-right">Amount</span>
                </div>

                <div className="py-2 space-y-2 text-xs">
                  {cart.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-start font-semibold">
                        <span className="w-7/12">
                          {item.isVeg ? "🟢 " : "🔴 "}
                          {item.name}
                          {item.portionName && (
                            <span className="text-[10px] text-amber-800 font-bold ml-1">
                              ({item.portionName})
                            </span>
                          )}
                        </span>
                        <span className="w-2/12 text-center font-mono">{item.quantity}</span>
                        <span className="w-3/12 text-right font-mono font-bold">
                          {formatINR(item.itemTotal)}
                        </span>
                      </div>
                      {item.modifiers.length > 0 && (
                        <div className="pl-4 text-[10px] text-slate-500">
                          {item.modifiers.map((m, mIdx) => (
                            <span key={mIdx} className="mr-2">
                              +{m.name} ({formatINR(m.price)})
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <div className="pl-4 text-[10px] text-amber-700 italic">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="p-4 bg-slate-50/70 text-xs space-y-1 border-b border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal:</span>
                  <span className="font-mono">{formatINR(calculation.subtotal)}</span>
                </div>

                {calculation.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-{formatINR(calculation.couponDiscount)}</span>
                  </div>
                )}

                {calculation.pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Loyalty Points ({calculation.pointsRedeemed} pts):</span>
                    <span className="font-mono">-{formatINR(calculation.pointsDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>CGST (2.5%):</span>
                  <span className="font-mono">{formatINR(calculation.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>SGST (2.5%):</span>
                  <span className="font-mono">{formatINR(calculation.sgst)}</span>
                </div>

                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-black text-sm text-slate-900">
                  <span>Net Payable:</span>
                  <span className="font-mono text-lg text-amber-700">
                    {formatINR(calculation.finalTotal)}
                  </span>
                </div>
              </div>

              {/* Dynamic QR Code in Invoice Preview */}
              <div className="p-4 text-center bg-white border-b border-slate-200 flex flex-col items-center">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Scan to Pay with Any UPI App</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageSrc}
                  alt="UPI QR Code"
                  className="w-28 h-28 object-contain my-1 border border-slate-200 rounded-xl p-1"
                />
                <div className="text-[10px] font-mono text-slate-500">
                  UPI ID: <strong>{settings.upiId}</strong> ({settings.upiPayeeName})
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  GPay • PhonePe • Paytm • BHIM • CRED
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 text-center text-[10px] text-slate-400">
                WiFi: {settings.wifiSsid} | Pass: {settings.wifiPass}
              </div>
            </div>
          ) : (
            /* 80mm Thermal Monospace Preview */
            <div className="w-[300px] bg-white p-4 font-mono text-black text-xs leading-tight border border-slate-300 rounded-none shadow-md">
              <div className="text-center font-bold">
                <div className="text-sm uppercase">{settings.cafeName}</div>
                <div className="text-[10px] font-normal">{settings.address}</div>
                <div className="text-[10px] font-normal">GSTIN: {settings.gstNumber}</div>
              </div>
              <div className="my-1 border-t border-dashed border-black"></div>
              <div className="flex justify-between text-[11px]">
                <span>Order: #{orderNumberPreview}</span>
                <span>Type: {orderType}</span>
              </div>
              {orderType === "DELIVERY" && zomatoOrderId && (
                <div className="text-[11px] font-bold">ZOMATO: #{zomatoOrderId}</div>
              )}
              <div className="my-1 border-t border-dashed border-black"></div>
              <div className="py-1 space-y-1 text-[11px]">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="w-7/12 truncate">{item.quantity}x {item.name}{item.portionName ? ` (${item.portionName})` : ""}</span>
                    <span className="w-5/12 text-right">{formatINR(item.itemTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="my-1 border-t border-dashed border-black"></div>
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatINR(calculation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST 5%:</span>
                  <span>{formatINR(calculation.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                  <span>NET TOTAL:</span>
                  <span>{formatINR(calculation.finalTotal)}</span>
                </div>
              </div>
              <div className="my-1.5 border-t border-dashed border-black"></div>
              {/* Embedded QR Code representation in thermal receipt */}
              <div className="text-center my-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageSrc}
                  alt="UPI QR Code"
                  className="w-24 h-24 mx-auto object-contain"
                />
                <div className="text-[9px] mt-1">Scan to Pay: {settings.upiId}</div>
              </div>
              <div className="text-center text-[10px]">*** THANK YOU ***</div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
          >
            ← Back to Edit Cart
          </button>

          <button
            type="button"
            onClick={handlePunchFromPreview}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Confirm & Punch Order</span>
          </button>
        </div>
      </div>
      </div>
    </Portal>
  );
}
