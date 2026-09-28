"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Order, CafeSettings } from "@/lib/types";
import { getOrderById, getSettings, getOrders, DEFAULT_CAFE_SETTINGS } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import {
  Printer,
  Coffee,
  Wifi,
  ChevronLeft,
  Copy,
  Check,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import ThermalReceipt80mm from "@/components/ThermalReceipt80mm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { dispatchWhatsAppViaWeb, getAppBaseUrl } from "@/lib/notifications";

export default function DigitalBillPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_CAFE_SETTINGS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getOrderById(id);
      if (found) {
        setOrder(found);
      } else {
        const all = getOrders();
        if (all.length > 0) {
          setOrder(all[0]);
        }
      }
    }
    setSettings(getSettings());
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const fullUrl = `${getAppBaseUrl()}/bill/${order?.id || id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!order) return;
    dispatchWhatsAppViaWeb({
      order,
      settings,
      baseUrl: getAppBaseUrl(),
    });
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/pos");
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Coffee className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
          <h2 className="text-lg font-bold mb-1">Receipt Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Could not find an order receipt with ID &quot;{id}&quot;.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.upiPayeeName
  )}&am=${order.finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order ${order.orderNumber}`
  )}`;

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiIntentUrl
  )}&margin=8`;

  return (
    <>
      {/* Hidden container dedicated for clean thermal browser print */}
      <div id="printable-receipt" className="hidden print:block">
        <ThermalReceipt80mm order={order} settings={settings} />
      </div>

      {/* Screen View: Mobile-First Digital Receipt with Smooth Scrolling */}
      <div className="w-full h-full min-h-screen overflow-y-auto bg-slate-100 dark:bg-slate-950 py-6 sm:py-8 px-4 flex flex-col items-center justify-start text-slate-800 dark:text-slate-200 no-print pb-28">
        {/* Top Floating Control Bar */}
        <div className="w-full max-w-md flex items-center justify-between mb-4 text-xs">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-xs"
              title="Share this receipt on WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
              title="Copy receipt link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Paper Receipt Card with authentic styling */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Top Decorative Cafe Header */}
          <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-6 text-center relative overflow-hidden">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner border border-white/20">
              <Coffee className="w-8 h-8 text-amber-200" />
            </div>
            <h1 className="text-xl font-black tracking-tight">{settings.cafeName}</h1>
            <p className="text-xs text-amber-200/90 font-medium mt-0.5">{settings.tagline}</p>
            <p className="text-[11px] text-amber-100/70 mt-2 leading-relaxed">
              {settings.address}
            </p>
            <p className="text-[11px] text-amber-100/70">Phone: {settings.phone}</p>
          </div>

          {/* Payment Status Ribbon */}
          <div className="bg-emerald-50 border-y border-emerald-100 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-900">
                PAID via{" "}
                {order.orderType === "DELIVERY" || order.paymentMethod === "ZOMATO"
                  ? "Zomato Online (Settlement)"
                  : order.paymentMethod}
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-bold">
              {formatINR(order.finalTotal)}
            </span>
          </div>

          {/* Order Details Metadata */}
          <div className="p-6 pb-4 border-b border-dashed border-slate-300">
            <div className="flex justify-between items-start text-xs text-slate-600 mb-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Order Number
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  #{order.orderNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  KOT Ticket
                </span>
                <span className="font-mono font-bold text-sm text-amber-700">
                  {order.kotNumber}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-600 mb-2">
              <span>Date &amp; Time:</span>
              <span className="font-medium text-slate-800">
                {formattedDate}, {formattedTime}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Order Type:</span>
              <span className="font-bold text-slate-800">
                {order.orderType === "DELIVERY" || order.paymentMethod === "ZOMATO"
                  ? `Zomato Delivery ${order.zomatoOrderId ? `(#${order.zomatoOrderId})` : ""}`
                  : order.orderType}{" "}
                {order.tableNumber ? `(${order.tableNumber})` : ""}
              </span>
            </div>

            {order.notes && (
              <div className="mt-2 text-xs bg-slate-100 p-2 rounded-lg text-slate-700 font-medium">
                {order.notes}
              </div>
            )}

            {order.customerName && (
              <div className="flex justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span>Customer:</span>
                <span className="font-medium text-slate-800">
                  {order.customerName} ({order.customerPhone})
                </span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="p-6 py-4 border-b border-dashed border-slate-300">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-200 flex justify-between">
              <span className="w-7/12">Item &amp; Description</span>
              <span className="w-2/12 text-center">Qty</span>
              <span className="w-3/12 text-right">Amount</span>
            </div>

            <div className="py-2 space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between items-start font-semibold text-slate-900">
                    <div className="w-7/12 flex items-start gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-xs mt-1 flex-shrink-0 bg-emerald-600"
                        title="100% Pure Vegetarian"
                      />
                      <span>{item.name}</span>
                      {item.portionName && !item.name.includes(item.portionName) && (
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-mono">
                          {item.portionName}
                        </span>
                      )}
                    </div>
                    <span className="w-2/12 text-center font-mono text-slate-700">
                      {item.quantity}
                    </span>
                    <span className="w-3/12 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.subtotal)}
                    </span>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-4 text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                      {item.modifiers.map((m, mIdx) => (
                        <div key={mIdx} className="flex justify-between">
                          <span>+ {m.name}</span>
                          <span className="font-mono">+{formatINR(m.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="pl-4 text-[10px] text-amber-700 italic mt-0.5">
                      Instructions: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-6 py-4 bg-slate-50/70 border-b border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal</span>
              <span className="font-mono">{formatINR(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({order.couponCode || "PROMO"})</span>
                <span className="font-mono">-{formatINR(order.discountAmount)}</span>
              </div>
            )}

            {settings.enableLoyaltyProgram !== false && order.pointsDiscount > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Loyalty Points Redeemed ({order.pointsRedeemed} pts)</span>
                <span className="font-mono">-{formatINR(order.pointsDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>CGST ({settings.cgstRatePercent}%)</span>
              <span className="font-mono">{formatINR(order.cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>SGST ({settings.sgstRatePercent}%)</span>
              <span className="font-mono">{formatINR(order.sgst)}</span>
            </div>

            <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-black text-base text-slate-900">
              <span>Total Paid</span>
              <span className="font-mono text-xl text-amber-700">
                {formatINR(order.finalTotal)}
              </span>
            </div>
          </div>

          {/* Dynamic UPI QR Code Section */}
          <div className="p-6 text-center bg-white border-b border-slate-200 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / BharatQR Digital Payment</span>
            </div>

            <div className="w-44 h-44 bg-white p-2 rounded-2xl shadow-inner border-2 border-slate-200 flex items-center justify-center my-1 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageSrc}
                alt="Dynamic UPI QR Code"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div className="text-xs font-mono font-bold text-slate-800 mt-2">
              UPI ID: <span className="text-indigo-600">{settings.upiId}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Payee: <strong>{settings.upiPayeeName}</strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Scan with GPay, PhonePe, Paytm, BHIM, or any banking app
            </p>
          </div>

          {/* Loyalty Points Earned Banner */}
          {settings.enableLoyaltyProgram !== false && order.pointsEarned > 0 && (
            <div className="bg-amber-50 border-b border-amber-200/80 p-4 flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  ★
                </div>
                <div>
                  <div className="font-bold text-xs">Loyalty Reward Earned!</div>
                  <div className="text-[11px] text-amber-700">
                    Use on your next coffee visit
                  </div>
                </div>
              </div>
              <span className="font-mono font-black text-sm bg-amber-200/80 px-2.5 py-1 rounded-lg text-amber-900">
                +{order.pointsEarned} pts
              </span>
            </div>
          )}

          {/* Guest Perks & WiFi */}
          <div className="p-6 text-center space-y-2 bg-white">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[11px] text-slate-700 font-medium">
              <Wifi className="w-3.5 h-3.5 text-amber-600" />
              <span>
                WiFi: <strong>{settings.wifiSsid}</strong> | Pass:{" "}
                <strong>{settings.wifiPass}</strong>
              </span>
            </div>

            <div className="text-[10px] text-slate-400 space-y-0.5 pt-2">
              <p>GSTIN: {settings.gstNumber} | FSSAI: {settings.fssaiNumber}</p>
              <p>Thank you for dining at {settings.cafeName}!</p>
            </div>
          </div>

          {/* Bottom border edge */}
          <div className="h-3 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800"></div>
        </div>
      </div>
    </>
  );
}
