"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CustomInvoice,
  InvoiceLineItem,
  MenuItem,
  Customer,
  CafeSettings,
  PaymentMethod,
  InvoiceStatus,
} from "@/lib/types";
import {
  getMenuItems,
  getCustomers,
  getSettings,
  saveCustomInvoice,
  getCustomInvoices,
  DEFAULT_CAFE_SETTINGS,
} from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import {
  FileText,
  Plus,
  Trash2,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Printer,
  Eye,
  CheckCircle2,
  ChevronLeft,
  Smartphone,
  CreditCard,
  Building2,
  Save,
  Coffee,
} from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

export default function CreateInvoicePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_CAFE_SETTINGS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [invoiceType, setInvoiceType] = useState<
    "TAX_INVOICE" | "CATERING" | "B2B_SUPPLY" | "PROFORMA"
  >("TAX_INVOICE");

  // Client Details
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Karnataka (29)");

  // Payment & Terms
  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>("PAID");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI_QR");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [terms, setTerms] = useState(
    "1. Payment due within 7 days. 2. Please scan the dynamic UPI QR code or transfer to our bank account. 3. Goods once delivered cannot be returned."
  );

  // Line Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: "line-1",
      name: "Specialty Roasted Coffee Beans (1kg Bag)",
      description: "Artisan Whole Beans, Chikmagalur Medium Roast",
      hsnCode: "0901",
      quantity: 2,
      unitPrice: 1200,
      discount: 0,
      gstRate: 5,
      taxableAmount: 2400,
      cgst: 60,
      sgst: 60,
      total: 2520,
    },
    {
      id: "line-2",
      name: "Gourmet Catering Box (20 servings)",
      description: "Assorted Croissants, Paninis and Cold Brew Jugs",
      hsnCode: "1905",
      quantity: 1,
      unitPrice: 3800,
      discount: 200,
      gstRate: 5,
      taxableAmount: 3600,
      cgst: 90,
      sgst: 90,
      total: 3780,
    },
  ]);

  // Live preview toggle
  const [showLivePreview, setShowLivePreview] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setMenuItems(getMenuItems());
    const custs = getCustomers();
    setCustomers(custs);

    // Generate next invoice number
    const existing = getCustomInvoices();
    const nextNum = existing.length + 1;
    setInvoiceNumber(`INV-2026-${nextNum.toString().padStart(3, "0")}`);
  }, []);

  // When picking existing customer
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    const c = customers.find((cust) => cust.id === custId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      if (c.email) setCustomerEmail(c.email);
      if (c.gstin) setCustomerGstin(c.gstin);
      if (c.address) setCustomerAddress(c.address);
    }
  };

  // Add Item from menu
  const handleAddFromMenu = (menuItemId: string) => {
    const mi = menuItems.find((m) => m.id === menuItemId);
    if (!mi) return;

    const rate = mi.price;
    const qty = 1;
    const gstRate = 5;
    const taxable = rate * qty;
    const cgst = (taxable * (gstRate / 2)) / 100;
    const sgst = (taxable * (gstRate / 2)) / 100;
    const total = taxable + cgst + sgst;

    const newLine: InvoiceLineItem = {
      id: `line-${Date.now()}`,
      itemId: mi.id,
      name: mi.name,
      description: mi.description,
      hsnCode: mi.category.includes("Pastr") || mi.category.includes("Sand") ? "1905" : "2101",
      quantity: qty,
      unitPrice: rate,
      discount: 0,
      gstRate,
      taxableAmount: taxable,
      cgst,
      sgst,
      total,
    };

    setItems([...items, newLine]);
  };

  // Add Custom blank line item
  const handleAddBlankLine = () => {
    const newLine: InvoiceLineItem = {
      id: `line-${Date.now()}`,
      name: "",
      description: "",
      hsnCode: "9963",
      quantity: 1,
      unitPrice: 500,
      discount: 0,
      gstRate: 5,
      taxableAmount: 500,
      cgst: 12.5,
      sgst: 12.5,
      total: 525,
    };
    setItems([...items, newLine]);
  };

  const handleUpdateLine = (id: string, updates: Partial<InvoiceLineItem>) => {
    setItems((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        const updated = { ...line, ...updates };

        const qty = Math.max(1, updated.quantity || 1);
        const rate = Math.max(0, updated.unitPrice || 0);
        const disc = Math.min(qty * rate, Math.max(0, updated.discount || 0));
        const taxable = qty * rate - disc;
        const gst = updated.gstRate || 0;
        const cgst = Number(((taxable * (gst / 2)) / 100).toFixed(2));
        const sgst = Number(((taxable * (gst / 2)) / 100).toFixed(2));
        const total = Number((taxable + cgst + sgst).toFixed(2));

        return {
          ...updated,
          quantity: qty,
          unitPrice: rate,
          discount: disc,
          taxableAmount: taxable,
          cgst,
          sgst,
          total,
        };
      })
    );
  };

  const handleRemoveLine = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  // Summary Computations
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + i.discount, 0);
  const taxableAmount = items.reduce((s, i) => s + i.taxableAmount, 0);
  const totalCgst = items.reduce((s, i) => s + i.cgst, 0);
  const totalSgst = items.reduce((s, i) => s + i.sgst, 0);
  const totalTax = Number((totalCgst + totalSgst).toFixed(2));
  const rawTotal = taxableAmount + totalTax;
  const finalTotal = Math.round(rawTotal);
  const roundOff = Number((finalTotal - rawTotal).toFixed(2));

  // Handle Save
  const handleSave = (andPrint = false) => {
    if (!customerName.trim()) {
      setValidationAlert("Please enter customer or company name to generate this invoice.");
      return;
    }

    const newInvoice: CustomInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `INV-${Date.now()}`,
      date: invoiceDate,
      dueDate: dueDate || undefined,
      invoiceType,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerGstin: customerGstin.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      placeOfSupply,
      items,
      subtotal,
      discountAmount: totalDiscount,
      taxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      totalTax,
      roundOff,
      finalTotal,
      paymentStatus,
      paymentMethod,
      paymentRef: paymentRef.trim() || undefined,
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveCustomInvoice(newInvoice);

    if (andPrint) {
      router.push(`/invoices/${newInvoice.id}?autoPrint=true`);
    } else {
      router.push(`/invoices/${newInvoice.id}`);
    }
  };

  // Dynamic UPI Intent URL for Invoice QR Code
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.upiPayeeName
  )}&am=${finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Invoice_${invoiceNumber}`
  )}`;

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiIntentUrl
  )}&margin=8`;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 space-y-6 max-w-7xl mx-auto w-full transition-colors">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/invoices");
              }
            }}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Invoice Creation Desk</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                GST Compliant
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dedicated module for custom B2B tax bills, catering orders, and formal invoicing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showLivePreview
                ? "bg-amber-600 text-white border-amber-600 shadow-md"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{showLivePreview ? "Hide Preview" : "Live Preview"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Issue & Print Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7/12: Invoicing Form Controls */}
        <div className={`${showLivePreview ? "lg:col-span-7" : "lg:col-span-12"} space-y-6`}>
          {/* 1. Invoice Meta Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Invoice Specifications</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Invoice Category</label>
                <select
                  value={invoiceType}
                  onChange={(e: any) => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TAX_INVOICE">Standard Tax Invoice</option>
                  <option value="CATERING">Catering / Event Bill</option>
                  <option value="B2B_SUPPLY">B2B Corporate Supply</option>
                  <option value="PROFORMA">Proforma Invoice</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Customer & Billing Entity Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>Bill To / Customer Information</span>
              </h3>

              {/* Quick Pick Existing Customer */}
              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick Fill:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg focus:outline-none"
                  >
                    <option value="">Select Existing Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech Labs Pvt Ltd or John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Client GSTIN (B2B)</label>
                <input
                  type="text"
                  placeholder="29AAAAA0000A1Z5"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="accounts@client.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Place of Supply</label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Billing Address</label>
                <input
                  type="text"
                  placeholder="Street address, city, state, postal code"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Line Items Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                <span>Line Items & Pricing</span>
              </h3>

              <div className="flex items-center gap-2">
                {/* Add from menu selector */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddFromMenu(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl focus:outline-none"
                >
                  <option value="">+ Add from Cafe Menu...</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatINR(m.price)})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddBlankLine}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Item</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((line, idx) => (
                <div
                  key={line.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Item Name / Service"
                        value={line.name}
                        onChange={(e) =>
                          handleUpdateLine(line.id, { name: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="HSN/SAC"
                        value={line.hsnCode || ""}
                        onChange={(e) =>
                          handleUpdateLine(line.id, { hsnCode: e.target.value })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            quantity: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate (₹)"
                        value={line.unitPrice}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-right focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subline: Description + Discount + GST Rate + Row Total */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Description (Optional notes, bean origin, etc.)"
                        value={line.description || ""}
                        onChange={(e) =>
                          handleUpdateLine(line.id, { description: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-1">
                      <span>Disc:</span>
                      <input
                        type="number"
                        min="0"
                        value={line.discount}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            discount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-1">
                      <span>GST:</span>
                      <select
                        value={line.gstRate}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            gstRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                      Total: {formatINR(line.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Payment Method & Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Payment & Settlement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:ring-1 focus:ring-amber-500"
                >
                  <option value="PAID">PAID (Settled)</option>
                  <option value="PENDING">PENDING (Payment Due)</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:ring-1 focus:ring-amber-500"
                >
                  <option value="UPI_QR">Dynamic UPI / BharatQR</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">
                  Transaction / UTR Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-98218391283"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 5/12: Live Invoice Preview or Split Pane */}
        <div className={`${showLivePreview ? "lg:col-span-5" : "lg:col-span-12"} space-y-4`}>
          {/* Summary Financials Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs space-y-2 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Invoice Summary
            </h3>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Item Subtotal:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatINR(subtotal)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discounts:</span>
                <span className="font-mono">-{formatINR(totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Taxable Value:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatINR(taxableAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>CGST Total:</span>
              <span className="font-mono">{formatINR(totalCgst)}</span>
            </div>

            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>SGST Total:</span>
              <span className="font-mono">{formatINR(totalSgst)}</span>
            </div>

            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Round Off:</span>
                <span className="font-mono">{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline font-black text-sm">
              <span className="text-slate-900 dark:text-white">Grand Total:</span>
              <span className="font-mono text-xl text-amber-600 dark:text-amber-400">
                {formatINR(finalTotal)}
              </span>
            </div>
          </div>

          {/* Dedicated Live A4 Tax Invoice Card */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 text-xs space-y-4">
            {/* Letterhead */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-black text-base tracking-tight text-amber-900">
                  {settings.cafeName}
                </h2>
                <p className="text-[11px] text-slate-600">{settings.tagline}</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">{settings.address}</p>
                <p className="text-[10px] text-slate-500">
                  GSTIN: <strong>{settings.gstNumber}</strong> | FSSAI: {settings.fssaiNumber}
                </p>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[10px] uppercase">
                  {invoiceType.replace("_", " ")}
                </span>
                <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                  #{invoiceNumber || "INV-DRAFT"}
                </div>
                <div className="text-[10px] text-slate-500">
                  Date: {invoiceDate}
                </div>
              </div>
            </div>

            {/* Bill To Preview */}
            <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] space-y-0.5">
              <div className="font-bold text-slate-800">
                Bill To: {customerName || "Customer Name"}
              </div>
              {customerGstin && (
                <div className="font-mono text-slate-600">
                  GSTIN: {customerGstin}
                </div>
              )}
              {customerAddress && (
                <div className="text-slate-500">{customerAddress}</div>
              )}
              {customerPhone && (
                <div className="text-slate-500">Phone: {customerPhone}</div>
              )}
            </div>

            {/* Items Summary Table */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase border-b border-slate-200 pb-1">
                <span className="w-6/12">Item</span>
                <span className="w-2/12 text-center">Qty</span>
                <span className="w-2/12 text-right">Rate</span>
                <span className="w-2/12 text-right">Total</span>
              </div>
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-[11px] py-0.5">
                  <span className="w-6/12 font-medium truncate">{i.name || "Untitled Item"}</span>
                  <span className="w-2/12 text-center font-mono">{i.quantity}</span>
                  <span className="w-2/12 text-right font-mono">{formatINR(i.unitPrice)}</span>
                  <span className="w-2/12 text-right font-mono font-bold">{formatINR(i.total)}</span>
                </div>
              ))}
            </div>

            {/* Dynamic UPI QR Code on the Customer Tax Invoice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-1 mb-1">
                <Smartphone className="w-3 h-3 text-indigo-600" />
                <span>Instant Payment UPI QR</span>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageSrc}
                alt="UPI QR Code"
                className="w-28 h-28 object-contain my-1 border border-slate-200 rounded-lg p-1 bg-white"
              />
              <div className="text-[10px] font-mono text-slate-700">
                UPI ID: <strong>{settings.upiId}</strong>
              </div>
              <div className="text-[9px] text-slate-400">
                Amount: {formatINR(finalTotal)}
              </div>
            </div>

            {/* Bank details for NEFT */}
            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg space-y-0.5">
              <div>Bank: <strong>{settings.bankName}</strong></div>
              <div>A/C: <strong>{settings.accountNumber}</strong> | IFSC: <strong>{settings.ifscCode}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Validation Notice Modal */}
      <ConfirmModal
        isOpen={Boolean(validationAlert)}
        onClose={() => setValidationAlert(null)}
        title="Required Information"
        description={validationAlert || ""}
        confirmText="Got It"
        variant="warning"
        isAlertOnly={true}
      />
    </div>
  );
}
