import React from "react";
import { Order, CafeSettings } from "@/lib/types";
import { formatINR } from "@/lib/calculator";

interface Props {
  order: Order;
  settings: CafeSettings;
}

export default function ThermalReceipt80mm({ order, settings }: Props) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.upiPayeeName
  )}&am=${order.finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order_${order.orderNumber}`
  )}`;

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    upiIntentUrl
  )}&margin=4`;

  const isZomatoOrder =
    order.orderType === "DELIVERY" ||
    order.paymentMethod === "ZOMATO" ||
    Boolean(order.zomatoOrderId);

  return (
    <div className="thermal-80mm w-full text-black leading-tight select-text rounded-none">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-bold text-base uppercase tracking-wider">
          {settings.cafeName}
        </h1>
        <p className="text-[11px]">{settings.tagline}</p>
        <p className="text-[10px] mt-1">{settings.address}</p>
        <p className="text-[10px]">Phone: {settings.phone}</p>
        <p className="text-[10px]">
          GSTIN: {settings.gstNumber} | FSSAI: {settings.fssaiNumber}
        </p>
      </div>

      <div className="print-cut-line my-1.5 border-t border-dashed border-black"></div>

      {/* Order Info */}
      <div className="flex justify-between text-[11px]">
        <span>Order: <strong>#{order.orderNumber}</strong></span>
        <span>KOT: <strong>#{order.kotNumber}</strong></span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span>Date: {formattedDate}</span>
        <span>Time: {formattedTime}</span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span>
          Type:{" "}
          <strong>
            {isZomatoOrder
              ? `ZOMATO DELIVERY ${order.zomatoOrderId ? `(#${order.zomatoOrderId})` : ""}`
              : order.orderType}
          </strong>
        </span>
        {order.tableNumber && <span>Table: <strong>{order.tableNumber}</strong></span>}
      </div>

      {order.notes && (
        <div className="text-[10px] font-bold mt-0.5">
          {order.notes}
        </div>
      )}

      {order.customerName && (
        <div className="text-[11px] mt-0.5">
          <span>Cust: {order.customerName} ({order.customerPhone})</span>
        </div>
      )}

      <div className="print-cut-line my-1.5 border-t border-dashed border-black"></div>

      {/* Item Table Header */}
      <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-black">
        <span className="w-7/12 text-left">ITEM</span>
        <span className="w-2/12 text-center">QTY</span>
        <span className="w-3/12 text-right">AMT(₹)</span>
      </div>

      {/* Item Rows */}
      <div className="py-1 space-y-1 text-[11px]">
        {order.items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between">
              <span className="w-7/12 text-left font-medium leading-snug">
                [V] {item.name}
                {item.portionName && !item.name.includes(item.portionName) && (
                  <span> ({item.portionName})</span>
                )}
              </span>
              <span className="w-2/12 text-center">{item.quantity}</span>
              <span className="w-3/12 text-right">{item.subtotal.toFixed(2)}</span>
            </div>
            {/* Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="pl-3 text-[10px] text-gray-700">
                {item.modifiers.map((m, mIdx) => (
                  <div key={mIdx} className="flex justify-between">
                    <span>+ {m.name}</span>
                    <span>+{m.price}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Item notes */}
            {item.notes && (
              <div className="pl-3 text-[9px] italic text-gray-600">
                Note: {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="print-cut-line my-1 border-t border-dashed border-black"></div>

      {/* Financial Breakdown */}
      <div className="text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>Item Subtotal:</span>
          <span>₹{order.subtotal.toFixed(2)}</span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex justify-between font-medium">
            <span>Coupon Discount ({order.couponCode || "PROMO"}):</span>
            <span>-₹{order.discountAmount.toFixed(2)}</span>
          </div>
        )}

        {settings.enableLoyaltyProgram !== false && order.pointsDiscount > 0 && (
          <div className="flex justify-between font-medium">
            <span>Loyalty Points ({order.pointsRedeemed} pts):</span>
            <span>-₹{order.pointsDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-700">
          <span>CGST ({settings.cgstRatePercent}%):</span>
          <span>₹{order.cgst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>SGST ({settings.sgstRatePercent}%):</span>
          <span>₹{order.sgst.toFixed(2)}</span>
        </div>

        <div className="print-cut-line my-1 border-t border-dashed border-black"></div>

        <div className="flex justify-between font-bold text-sm pt-0.5">
          <span>NET PAYABLE:</span>
          <span>₹{order.finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="print-cut-line my-1.5 border-t border-dashed border-black"></div>

      {/* UPI QR Code for In-Store or Settled Banner for Zomato */}
      {isZomatoOrder ? (
        <div className="text-center my-2.5 p-2.5 border border-black border-dashed bg-gray-50">
          <div className="text-[11px] font-bold uppercase tracking-wider">
            ★ PAID VIA ZOMATO ONLINE ★
          </div>
          <div className="text-[10px] font-mono font-bold mt-0.5">
            Ref: #{order.zomatoOrderId || "ONLINE"}
          </div>
          <div className="text-[9px] text-gray-700 mt-0.5">
            Platform Settlement Reconciled
          </div>
        </div>
      ) : (
        <div className="text-center my-2">
          <div className="text-[10px] font-bold uppercase mb-1">
            Scan to Pay via UPI
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageSrc}
            alt="UPI QR Code"
            className="w-28 h-28 mx-auto object-contain"
          />
          <div className="text-[9px] font-mono mt-1">
            UPI ID: {settings.upiId}
          </div>
          <div className="text-[8px] text-gray-600">
            GPay • PhonePe • Paytm • BHIM
          </div>
        </div>
      )}

      <div className="print-cut-line my-1.5 border-t border-dashed border-black"></div>

      {/* Payment & Rewards */}
      <div className="text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Payment Mode:</span>
          <span className="font-bold">
            {isZomatoOrder ? "ZOMATO ONLINE" : order.paymentMethod}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Payment Status:</span>
          <span className="font-bold">{order.paymentStatus}</span>
        </div>
        {settings.enableLoyaltyProgram !== false && order.pointsEarned > 0 && (
          <div className="flex justify-between font-medium text-emerald-800">
            <span>Points Earned Today:</span>
            <span>+{order.pointsEarned} pts</span>
          </div>
        )}
      </div>

      <div className="print-cut-line my-1.5 border-t border-dashed border-black"></div>

      {/* Footer Info */}
      <div className="text-center text-[10px] space-y-1 pb-2">
        <p className="font-semibold">Thank you for visiting!</p>
        <p className="break-words">
          Guest WiFi: {settings.wifiSsid} | Pass: {settings.wifiPass}
        </p>
        <p className="text-[9px] mt-1 break-all">
          Digital Bill: /bill/{order.id}
        </p>
        <div className="print-cut-line my-2 border-t border-dashed border-black"></div>
      </div>
    </div>
  );
}
