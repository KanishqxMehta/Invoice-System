"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/calculator";
import { X, CheckCircle, Smartphone, Copy, Check } from "lucide-react";
import Portal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  upiId: string;
  payeeName: string;
  orderNumber?: string;
  onPaymentSuccess?: () => void;
}

export default function UPIModal({
  isOpen,
  onClose,
  amount,
  upiId,
  payeeName,
  orderNumber = "ORD-LIVE",
  onPaymentSuccess,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsVerifying(false);
      setIsSuccess(false);
      setUtrNumber("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isVerifying) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isVerifying]);

  if (!isOpen) return null;

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Bill ${orderNumber}`
  )}`;

  // Quick reliable QR generator URL from public API or SVG
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    upiIntentUrl
  )}&margin=10`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = () => {
    if (isVerifying || isSuccess || amount <= 0) return;

    setIsVerifying(true);
    const ref = `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setUtrNumber(ref);

    // Phase 1: Simulate network verification webhook check (500ms)
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);

      // Phase 2: Show the green success confirmation card (800ms) then trigger order punch
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        } else {
          onClose();
        }
      }, 800);
    }, 600);
  };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isVerifying && !isSuccess) onClose();
        }}
      >
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6 animate-in zoom-in-95 duration-150">
          {!isSuccess && (
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full disabled:opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

        {isSuccess ? (
          <div className="py-6 px-2 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-lg ring-4 ring-emerald-500/20">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Payment Received!
            </h3>

            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-1 font-mono">
              {formatINR(amount)}
            </p>

            <div className="mt-3 w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">PAID (CONFIRMED)</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>UPI Ref:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{utrNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1.5 animate-pulse">
              <span>Punching order &amp; printing receipt...</span>
            </p>
          </div>
        ) : (
          <>
            {/* Brand Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Dynamic UPI / BharatQR</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Scan &amp; Pay
            </h3>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 my-1 font-mono">
              {formatINR(amount)}
            </p>

            {/* QR Code Container */}
            <div className="mt-3 mx-auto w-60 h-60 bg-white p-3 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageSrc}
                alt="UPI QR Code"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* UPI Details */}
            <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Payee:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {payeeName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">UPI ID:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                  <span>{upiId}</span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* UPI Partner Logos / Mention */}
            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-center gap-2">
              <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span> • <span>CRED</span>
            </div>

            {/* Simulate Confirmation Button */}
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isVerifying || amount <= 0}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              {amount <= 0 ? (
                <span>Order Total is ₹0</span>
              ) : isVerifying ? (
                <span className="animate-pulse">Verifying UPI Webhook...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Simulate Payment Received</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
    </Portal>
  );
}
