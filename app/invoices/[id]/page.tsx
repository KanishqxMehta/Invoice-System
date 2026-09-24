"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CustomInvoice, CafeSettings } from "@/lib/types";
import { getCustomInvoiceById, getSettings, getCustomInvoices, DEFAULT_CAFE_SETTINGS } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import {
  Printer,
  ChevronLeft,
  Share2,
  Copy,
  Check,
  Building,
  Smartphone,
  CheckCircle2,
  Coffee,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function ViewCustomInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams?.get("from");
  const id = params?.id as string;
  const autoPrint = searchParams?.get("autoPrint") === "true";

  const [invoice, setInvoice] = useState<CustomInvoice | null>(null);
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_CAFE_SETTINGS);
  const [copied, setCopied] = useState(false);

  const getBackLabel = () => {
    if (from === "/invoices") return "Back to Invoices";
    if (from === "/pos") return "Back to POS";
    return "Back to Invoices";
  };

  const handleBack = () => {
    if (from && from.startsWith("/")) {
      router.push(from);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/invoices");
  };

  useEffect(() => {
    if (id) {
      const inv = getCustomInvoiceById(id);
      if (inv) {
        setInvoice(inv);
      } else {
        const all = getCustomInvoices();
        if (all.length > 0) setInvoice(all[0]);
      }
    }
    setSettings(getSettings());

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [id, autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Coffee className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
          <h2 className="text-lg font-bold mb-1">Invoice Not Found</h2>
          <p className="text-xs text-slate-400 mb-4">
            Could not find an invoice with ID &quot;{id}&quot;.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{getBackLabel()}</span>
          </button>
        </div>
      </div>
    );
  }

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.upiPayeeName
  )}&am=${invoice.finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Invoice_${invoice.invoiceNumber}`
  )}`;

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiIntentUrl
  )}&margin=6`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 flex flex-col items-center transition-colors">
      {/* Top Floating Actions Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 text-xs no-print">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{getBackLabel()}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied" : "Share Invoice"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice (A4)</span>
          </button>
        </div>
      </div>

      {/* Formal A4 Tax Invoice Document */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-slate-200 text-slate-900 print:m-0 print:p-6 print:border-none print:shadow-none">
        {/* Top Header: Business Letterhead */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-800 text-white flex items-center justify-center font-bold">
                <Coffee className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {settings.cafeName}
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-semibold">{settings.tagline}</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">{settings.address}</p>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5 font-mono">
              <div>Phone: {settings.phone} {settings.email ? `• ${settings.email}` : ""}</div>
              <div>GSTIN: <strong>{settings.gstNumber}</strong> | FSSAI: {settings.fssaiNumber}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wider rounded-md inline-block">
              {invoice.invoiceType.replace("_", " ")}
            </span>
            <div className="font-mono font-black text-xl text-slate-900 mt-2">
              #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              <div>Date: {new Date(invoice.date).toLocaleDateString("en-IN")}</div>
              {invoice.dueDate && (
                <div>Due Date: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}</div>
              )}
              {invoice.placeOfSupply && (
                <div>Place of Supply: {invoice.placeOfSupply}</div>
              )}
            </div>

            <div className="mt-2">
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                  invoice.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : invoice.paymentStatus === "PENDING"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Dispatch Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To (Client / Customer):
            </span>
            <div className="font-bold text-sm text-slate-900 mb-0.5">
              {invoice.customerName}
            </div>
            {invoice.customerGstin && (
              <div className="font-mono text-slate-700">
                GSTIN: <strong>{invoice.customerGstin}</strong>
              </div>
            )}
            {invoice.customerAddress && (
              <div className="text-slate-600 mt-1 max-w-sm">
                {invoice.customerAddress}
              </div>
            )}
            <div className="text-slate-500 mt-1">
              {invoice.customerPhone && <span>Phone: {invoice.customerPhone} </span>}
              {invoice.customerEmail && <span>• {invoice.customerEmail}</span>}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment & Settlement Mode:
            </span>
            <div className="font-bold text-sm text-slate-900">
              {invoice.paymentMethod.replace("_", " ")}
            </div>
            {invoice.paymentRef && (
              <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                Ref / UTR: {invoice.paymentRef}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2 w-5/12">Item & Description</th>
                <th className="py-2 text-center w-1/12">HSN</th>
                <th className="py-2 text-center w-1/12">Qty</th>
                <th className="py-2 text-right w-1/12">Rate (₹)</th>
                <th className="py-2 text-right w-1/12">Disc (₹)</th>
                <th className="py-2 text-right w-1/12">GST %</th>
                <th className="py-2 text-right w-2/12">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-2.5 pr-2">
                    <div className="font-bold text-slate-900 text-xs">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 text-center font-mono text-slate-600">
                    {item.hsnCode || "-"}
                  </td>
                  <td className="py-2.5 text-center font-mono font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-emerald-700">
                    {item.discount > 0 ? `-${item.discount.toFixed(2)}` : "-"}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600">
                    {item.gstRate}%
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Split */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 py-6 border-b border-slate-200 text-xs">
          {/* Left Column: Bank & UPI QR Code */}
          <div className="sm:col-span-7 flex flex-wrap items-center gap-6">
            {/* Dynamic UPI QR Code */}
            <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
                Scan to Pay via UPI
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageSrc}
                alt="Dynamic UPI QR Code"
                className="w-32 h-32 object-contain mx-auto bg-white p-1 rounded-lg border border-slate-200"
              />
              <div className="text-[10px] font-mono font-bold text-slate-800 mt-1">
                {settings.upiId}
              </div>
              <div className="text-[9px] text-slate-400">
                GPay • PhonePe • Paytm • BHIM
              </div>
            </div>

            {/* Bank Transfer Information */}
            <div className="space-y-1 text-slate-600 font-mono text-[11px]">
              <div className="font-bold text-slate-900 font-sans text-xs mb-1">
                Bank Transfer (NEFT/RTGS):
              </div>
              <div>Bank: <strong>{settings.bankName}</strong></div>
              <div>Account #: <strong>{settings.accountNumber}</strong></div>
              <div>IFSC Code: <strong>{settings.ifscCode}</strong></div>
              <div>Payee: {settings.upiPayeeName}</div>
            </div>
          </div>

          {/* Right Column: Calculations */}
          <div className="sm:col-span-5 space-y-1.5 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatINR(invoice.subtotal)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Total Discount:</span>
                <span className="font-mono">-{formatINR(invoice.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatINR(invoice.taxableAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>CGST:</span>
              <span className="font-mono">{formatINR(invoice.cgst)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>SGST:</span>
              <span className="font-mono">{formatINR(invoice.sgst)}</span>
            </div>

            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Round Off:</span>
                <span className="font-mono">
                  {invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}
                </span>
              </div>
            )}

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-black text-base text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-xl text-amber-800">
                {formatINR(invoice.finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Authorised Signatory Footer */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              Terms & Conditions:
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {invoice.terms || settings.termsAndConditions || "Standard invoice terms apply."}
            </p>
            {invoice.notes && (
              <div className="mt-2 text-slate-500 text-[11px] italic">
                Note: {invoice.notes}
              </div>
            )}
          </div>

          <div className="sm:text-right flex flex-col justify-end items-start sm:items-end">
            <div className="w-48 border-t border-slate-400 pt-2 text-center">
              <div className="font-bold text-xs text-slate-900">
                For {settings.cafeName}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
