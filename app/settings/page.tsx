"use client";

import React, { useState, useEffect } from "react";
import {
  CafeSettings,
  NotificationLog,
  Order,
  KOTTicket,
} from "@/lib/types";
import {
  getSettings,
  saveSettings,
  getNotificationLogs,
  resetToDefaults,
  getOrders,
  getKOTTickets,
  getAllStoreDataJSON,
  getTables,
  setTableCount,
  addSingleTable,
  removeSingleTable,
  DEFAULT_CAFE_SETTINGS,
} from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import ThermalReceipt80mm from "@/components/ThermalReceipt80mm";
import ThermalKOT58mm from "@/components/ThermalKOT58mm";
import {
  Settings,
  Building,
  Receipt,
  QrCode,
  Printer,
  Send,
  Database,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Check,
  Copy,
  Download,
  AlertTriangle,
  Wifi,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  ShieldCheck,
  Percent,
  CreditCard,
  Search,
  Gift,
  Calculator,
  Clock,
  Utensils,
  Plus,
  Hash,
  X,
} from "lucide-react";
import Link from "next/link";
import Portal from "@/components/Portal";

type SettingsTab =
  | "profile"
  | "gst"
  | "loyalty"
  | "payments"
  | "hardware"
  | "notifications"
  | "database";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_CAFE_SETTINGS);
  const [notifs, setNotifs] = useState<NotificationLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kots, setKots] = useState<KOTTicket[]>([]);

  // Feedback states
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationLog | null>(null);
  const [notifSearch, setNotifSearch] = useState("");

  // Simulator states
  const [testUpiAmount, setTestUpiAmount] = useState<string>("350");
  const [copiedUpiUrl, setCopiedUpiUrl] = useState(false);
  const [testLoyaltyBillAmount, setTestLoyaltyBillAmount] = useState<string>("500");

  // Hardware print simulator
  const [printType, setPrintType] = useState<"80mm" | "58mm" | null>(null);

  // Table Configuration States
  const [settingTables, setSettingTables] = useState<string[]>([]);
  const [newCustomTable, setNewCustomTable] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setSettings(getSettings());
    setNotifs(getNotificationLogs());
    setOrders(getOrders());
    setKots(getKOTTickets());
    setSettingTables(getTables());

    const handleStorage = () => {
      setSettingTables(getTables());
      setSettings(getSettings());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showResetModal) setShowResetModal(false);
        if (selectedNotif) setSelectedNotif(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResetModal, selectedNotif]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSavedSuccess(true);
    showToast("Settings and cafe profile saved successfully!");
    setTimeout(() => setSavedSuccess(false), 3000);
    // Notify other components via storage event
    window.dispatchEvent(new Event("storage"));
  };

  const handleResetData = () => {
    resetToDefaults();
    setSettings(getSettings());
    setNotifs(getNotificationLogs());
    setOrders(getOrders());
    setKots(getKOTTickets());
    setShowResetModal(false);
    showToast("All data reset to clean default starter catalog!");
    window.dispatchEvent(new Event("storage"));
  };

  const handleDownloadBackup = () => {
    const jsonString = getAllStoreDataJSON();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `chandni_chowk_cheese_store_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Full store backup downloaded successfully!");
  };

  const sampleOrder: Order = orders[0] || {
    id: "ord-test",
    orderNumber: "ORD-9999",
    kotNumber: "KOT-99",
    customerName: "Rohan Verma",
    customerPhone: "+91 99100 98765",
    subtotal: 450,
    cgst: 11.25,
    sgst: 11.25,
    taxAmount: 22.5,
    discountAmount: 0,
    pointsRedeemed: 0,
    pointsDiscount: 0,
    finalTotal: 473,
    pointsEarned: 23,
    paymentMethod: "UPI_QR",
    paymentStatus: "PAID",
    orderType: "DINE_IN",
    tableNumber: "T-05",
    items: [
      {
        id: "item-1",
        name: "Spanish Iced Latte",
        quantity: 1,
        unitPrice: 250,
        modifiers: [{ name: "Oat Milk", price: 50 }],
        notes: "Less ice",
        subtotal: 300,
        isVeg: true,
      },
      {
        id: "item-2",
        name: "Steamed Dimsums",
        portionName: "Half Plate",
        quantity: 1,
        unitPrice: 140,
        modifiers: [],
        subtotal: 140,
        isVeg: true,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const sampleKOT: KOTTicket = kots[0] || {
    id: "kot-test",
    kotNumber: "KOT-99",
    orderId: "ord-test",
    orderNumber: "ORD-9999",
    orderType: "DINE_IN",
    tableNumber: "T-05",
    status: "ACTIVE",
    preparationNotes: "Less ice on Latte",
    items: sampleOrder.items,
    createdAt: new Date().toISOString(),
  };

  const triggerTestPrint = (type: "80mm" | "58mm") => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const upiTestIntentUrl = `upi://pay?pa=${encodeURIComponent(
    settings.upiId
  )}&pn=${encodeURIComponent(
    settings.upiPayeeName
  )}&am=${(parseFloat(testUpiAmount) || 0).toFixed(2)}&cu=INR&tn=Test_Bill`;

  const upiQrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiTestIntentUrl
  )}&margin=8`;

  const copyUpiIntent = () => {
    navigator.clipboard.writeText(upiTestIntentUrl);
    setCopiedUpiUrl(true);
    setTimeout(() => setCopiedUpiUrl(false), 2000);
  };

  const testLoyaltyBill = parseFloat(testLoyaltyBillAmount) || 0;
  const simulatedLoyaltyPoints = (settings.loyaltyEarnMode ?? "PERCENTAGE") === "SPEND_RATIO"
    ? (settings.pointEarnRateRatio > 0 ? Math.floor(testLoyaltyBill / settings.pointEarnRateRatio) : 0)
    : Math.round((testLoyaltyBill * (settings.loyaltyEarnPercent ?? 5)) / 100);
  const simulatedLoyaltyCashbackInr = simulatedLoyaltyPoints * (settings.pointRedeemRateInr || 1);
  const simulatedLoyaltyCashbackPct = testLoyaltyBill > 0 ? ((simulatedLoyaltyCashbackInr / testLoyaltyBill) * 100).toFixed(1) : "0.0";

  const filteredNotifs = notifs.filter((n) => {
    if (!notifSearch.trim()) return true;
    const q = notifSearch.toLowerCase();
    return (
      n.orderNumber.toLowerCase().includes(q) ||
      n.recipientPhone.toLowerCase().includes(q) ||
      n.customerName.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: "profile", label: "Store Profile", icon: Building },
    { id: "gst", label: "GST & Tax Invoicing", icon: Receipt },
    { id: "loyalty", label: "Loyalty & Rewards", icon: Gift },
    { id: "payments", label: "Dynamic UPI QR", icon: QrCode },
    { id: "hardware", label: "Thermal Printers", icon: Printer },
    { id: "notifications", label: "WhatsApp Logs", icon: Send },
    { id: "database", label: "Data & Backups", icon: Database },
  ] as const;

  return (
    <>
      {/* Hidden container dedicated strictly for window.print() */}
      {printType && (
        <div id="printable-receipt" className="hidden print:block">
          {printType === "80mm" ? (
            <ThermalReceipt80mm order={sampleOrder} settings={settings} />
          ) : (
            <ThermalKOT58mm ticket={sampleKOT} />
          )}
        </div>
      )}

      <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-[calc(100vh-3.5rem)] flex flex-col no-print transition-colors">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
                  <Settings className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Store &amp; System Settings</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      INR Config
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure store profile, GSTIN tax rules, Dynamic UPI QR, thermal hardware, and data backups
                  </p>
                </div>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs active:scale-95"
                title="Export complete database backup as JSON"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Backup Store Data</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/60 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-800 text-xs font-semibold transition-all shadow-xs active:scale-95"
                title="Restore initial store catalog and sample orders"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Store Data</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none ${
                    isSelected
                      ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents Area */}
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 flex-1">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* ---------------- TAB 1: STORE PROFILE ---------------- */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-400" />
                        <span>Business &amp; Cafe Identity</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        These details appear on physical thermal receipts, formal tax invoices, and WhatsApp messages
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Cafe Legal / Trade Name
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.cafeName}
                        onChange={(e) =>
                          setSettings({ ...settings, cafeName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. Chandni Chowk Cheese Cafe"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Tagline / Specialty Line
                      </label>
                      <input
                        type="text"
                        value={settings.tagline}
                        onChange={(e) =>
                          setSettings({ ...settings, tagline: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. Heritage Flavours & Artisan Melts"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Full Store Address
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.address}
                        onChange={(e) =>
                          setSettings({ ...settings, address: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Street address, Area, City, State, PIN"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Official Contact Phone
                      </label>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) =>
                          setSettings({ ...settings, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="+91 99000 12345"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Billing &amp; Support Email
                      </label>
                      <input
                        type="email"
                        value={settings.email || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, email: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="billing@chandnichowkcheese.in"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        FSSAI Food License #
                      </label>
                      <input
                        type="text"
                        value={settings.fssaiNumber}
                        onChange={(e) =>
                          setSettings({ ...settings, fssaiNumber: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="14-digit FSSAI Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Guest WiFi Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-indigo-400" />
                        <span>In-Store Guest WiFi Information</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Printed on the bottom of customer receipts so guests can connect seamlessly
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Guest WiFi SSID (Network Name)
                      </label>
                      <input
                        type="text"
                        value={settings.wifiSsid}
                        onChange={(e) =>
                          setSettings({ ...settings, wifiSsid: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. ChandniChowkCheese_Guest"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Guest WiFi Password
                      </label>
                      <input
                        type="text"
                        value={settings.wifiPass}
                        onChange={(e) =>
                          setSettings({ ...settings, wifiPass: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. coffeelover2026"
                      />
                    </div>
                  </div>
                </div>

                {/* Navbar & Header Display Settings Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Navbar Header Options</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Configure optional status elements displayed in the top navbar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Show Live Digital Clock in Navbar</span>
                        {settings.showNavbarClock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Displays the live ticking IST time in the top right navbar. Off by default to keep the navbar spacious and uncluttered.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showNavbarClock ?? false}
                        onChange={(e) => {
                          const updated = { ...settings, showNavbarClock: e.target.checked };
                          setSettings(updated);
                          saveSettings(updated);
                          window.dispatchEvent(new Event("storage"));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>

                {/* Dining Tables & Seating Capacity Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-500" />
                        <span>Dining Tables &amp; Seating Capacity</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono font-bold border border-amber-200 dark:border-amber-800">
                          {settingTables.length} Active Tables
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Configure table count for your cafe layout (scale up/down, add custom sections like Patio or VIP)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Stepper and Presets */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">
                          Total Table Count
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Set the exact number of tables for the POS terminal
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (settingTables.length > 1) {
                                const updated = setTableCount(settingTables.length - 1);
                                setSettingTables(updated);
                                showToast(`Reduced to ${updated.length} tables`);
                              }
                            }}
                            disabled={settingTables.length <= 1}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm disabled:opacity-40 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-xs px-2 min-w-[32px] text-center text-amber-600 dark:text-amber-400">
                            {settingTables.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (settingTables.length < 60) {
                                const updated = setTableCount(settingTables.length + 1);
                                setSettingTables(updated);
                                showToast(`Increased to ${updated.length} tables`);
                              }
                            }}
                            disabled={settingTables.length >= 60}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                        Quick Layouts:
                      </span>
                      {[4, 6, 8, 10, 12, 16, 20].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            const updated = setTableCount(preset);
                            setSettingTables(updated);
                            showToast(`Applied ${preset} tables layout`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                            settingTables.length === preset
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {preset} Tables
                        </button>
                      ))}
                    </div>

                    {/* Add Custom Table Name */}
                    <div className="flex gap-2 pt-1">
                      <div className="relative flex-1">
                        <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Custom table name (e.g. VIP-1, Patio-A, Terrace-1)"
                          value={newCustomTable}
                          onChange={(e) => setNewCustomTable(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const name = newCustomTable.trim();
                          if (!name) return;
                          if (settingTables.includes(name)) {
                            showToast(`Table "${name}" already exists`);
                            return;
                          }
                          const updated = addSingleTable(name);
                          setSettingTables(updated);
                          setNewCustomTable("");
                          showToast(`Table "${name}" added!`);
                        }}
                        disabled={!newCustomTable.trim()}
                        className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Custom Table</span>
                      </button>
                    </div>

                    {/* Active Tables Chips */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Current Configured Tables ({settingTables.length})
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                        {settingTables.map((tbl) => (
                          <div
                            key={tbl}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                          >
                            <span>{tbl}</span>
                            {settingTables.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = removeSingleTable(tbl);
                                  setSettingTables(updated);
                                  showToast(`Table ${tbl} removed`);
                                }}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors"
                                title={`Remove ${tbl}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TAB 2: GST & TAX INVOICING ---------------- */}
            {activeTab === "gst" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>GSTIN &amp; Indian Tax Configuration</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Default cafe restaurant tax structure is 5% GST (2.5% CGST + 2.5% SGST)
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        GSTIN (Goods and Services Tax Identification Number)
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.gstNumber}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            gstNumber: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="29AABCR8492M1ZX"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Total GST Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={settings.taxRatePercent}
                        onChange={(e) => {
                          const tot = parseFloat(e.target.value) || 0;
                          setSettings({
                            ...settings,
                            taxRatePercent: tot,
                            cgstRatePercent: tot / 2,
                            sgstRatePercent: tot / 2,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Standard restaurant GST = 5.0%
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        CGST Share (%)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={settings.cgstRatePercent}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            cgstRatePercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Central GST (Half of total)
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        SGST Share (%)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={settings.sgstRatePercent}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sgstRatePercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        State GST (Half of total)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Details for B2B & Corporate Invoices */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span>Bank NEFT / RTGS Details (For B2B Tax Invoices)</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Printed on A4 formal tax invoices generated at the Invoicing Desk
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Bank Name &amp; Branch
                      </label>
                      <input
                        type="text"
                        value={settings.bankName || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, bankName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. HDFC Bank Ltd, Indiranagar"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={settings.accountNumber || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, accountNumber: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. 50200084920194"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={settings.ifscCode || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ifscCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g. HDFC0000184"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Invoice Terms &amp; Conditions / Receipt Note
                      </label>
                      <textarea
                        rows={3}
                        value={settings.termsAndConditions || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            termsAndConditions: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                        placeholder="Custom invoice notes, payment terms, or catering policies..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TAB 3: LOYALTY & REWARDS PROGRAM ---------------- */}
            {activeTab === "loyalty" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <Gift className="w-4 h-4 text-amber-400" />
                          <span>Loyalty Points Earning &amp; Redemption</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Configure how customers earn loyalty cashback on purchases and redeem store credit
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={savedSuccess}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {savedSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <span>Save Rules</span>
                        )}
                      </button>
                    </div>

                    <div className="space-y-5">
                      {/* Earning Calculation Mode */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                          Points Awarding Model
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({ ...settings, loyaltyEarnMode: "PERCENTAGE" })
                            }
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              (settings.loyaltyEarnMode ?? "PERCENTAGE") === "PERCENTAGE"
                                ? "bg-amber-950/40 border-amber-600/80 text-white shadow-sm ring-1 ring-amber-500/50"
                                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-xs mb-1">
                              <span className="flex items-center gap-1.5 text-amber-300">
                                <Percent className="w-3.5 h-3.5" />
                                Percentage of Purchase (%)
                              </span>
                              {(settings.loyaltyEarnMode ?? "PERCENTAGE") === "PERCENTAGE" && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Customer receives a % cashback in points based on final bill total (e.g. 5% on ₹500 = 25 pts).
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setSettings({ ...settings, loyaltyEarnMode: "SPEND_RATIO" })
                            }
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              settings.loyaltyEarnMode === "SPEND_RATIO"
                                ? "bg-amber-950/40 border-amber-600/80 text-white shadow-sm ring-1 ring-amber-500/50"
                                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-xs mb-1">
                              <span className="flex items-center gap-1.5 text-amber-300">
                                <Calculator className="w-3.5 h-3.5" />
                                Spend Ratio (₹ per point)
                              </span>
                              {settings.loyaltyEarnMode === "SPEND_RATIO" && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Awards 1 point for every ₹X spent (e.g. 1 pt per ₹20 spent).
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Percentage Setting */}
                      {(settings.loyaltyEarnMode ?? "PERCENTAGE") === "PERCENTAGE" ? (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Default Loyalty Award Percentage (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={settings.loyaltyEarnPercent ?? 5}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  loyaltyEarnPercent: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-xl bg-slate-800 border border-slate-700 text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="5"
                            />
                            <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">
                              %
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            For a ₹1,000 order, the customer will earn <strong>{Math.round(1000 * ((settings.loyaltyEarnPercent ?? 5) / 100))} points</strong>. Cashier can also adjust this on-the-fly per order.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Rupees Spent per 1 Point Earned (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={settings.pointEarnRateRatio}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  pointEarnRateRatio: parseInt(e.target.value, 10) || 20,
                                })
                              }
                              className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-800 border border-slate-700 text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="20"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            For a ₹1,000 order, the customer will earn <strong>{Math.floor(1000 / (settings.pointEarnRateRatio || 20))} points</strong>.
                          </p>
                        </div>
                      )}

                      {/* Point Redemption Value & Welcome Bonus */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Point Value at Redemption (₹ per 1 pt)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={settings.pointRedeemRateInr}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  pointRedeemRateInr: parseFloat(e.target.value) || 1,
                                })
                              }
                              className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="1.00"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            When customer redeems 100 points, they get a ₹{((settings.pointRedeemRateInr || 1) * 100).toFixed(0)} discount.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            New Customer Welcome Bonus (pts)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={settings.welcomeBonusPoints ?? 50}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  welcomeBonusPoints: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full pl-3 pr-10 py-2 text-xs font-mono font-bold rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="50"
                            />
                            <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">
                              pts
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Automatically granted when cashier registers a new customer via Quick Add.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Simulator */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Live Purchase Simulator
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Simulated Order Purchase Amount:
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={testLoyaltyBillAmount}
                              onChange={(e) => setTestLoyaltyBillAmount(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="500"
                            />
                          </div>
                        </div>

                        {/* Computed Rewards Card */}
                        <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Order Bill:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatINR(testLoyaltyBill)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Points Awarded:</span>
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-base">
                              +{simulatedLoyaltyPoints} pts
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Store Credit Value:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatINR(simulatedLoyaltyCashbackInr)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">Effective Cashback:</span>
                            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              {simulatedLoyaltyCashbackPct}%
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 leading-relaxed">
                          💡 <strong>Cashier Flexibility</strong>: During checkout, cashiers can also use the <em>&quot;Set Points %&quot;</em> button in the cart to award custom percentages or flat bonus points on any specific bill.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TAB 4: DYNAMIC UPI QR ---------------- */}
            {activeTab === "payments" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-400" />
                          <span>UPI VPA &amp; QR Configuration</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Enables automatic Dynamic UPI QR codes on thermal receipts, preview modals, and digital bills
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                      >
                        Save Changes
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          UPI VPA ID (Virtual Payment Address)
                        </label>
                        <input
                          type="text"
                          required
                          value={settings.upiId}
                          onChange={(e) =>
                            setSettings({ ...settings, upiId: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="e.g. chandnichowkcheese@hdfcbank"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Compatible with Google Pay, PhonePe, Paytm, BHIM &amp; CRED
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          UPI Registered Merchant / Payee Name
                        </label>
                        <input
                          type="text"
                          required
                          value={settings.upiPayeeName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              upiPayeeName: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="e.g. Chandni Chowk Cheese Cafe"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Must match official bank account name for zero-friction customer approval
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-800">
                        <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>Zero Gateway Fees via Direct UPI QR</span>
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Dynamic UPI QR generates instant NPCI intent codes with zero MDR (0% transaction fees). Payments settle directly into your current account within seconds.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Interactive QR Preview */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-xs">
                    <div className="w-full">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Live Dynamic QR Simulator
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      </div>

                      <div className="mb-4">
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Simulate Bill Amount (₹ INR):
                        </label>
                        <input
                          type="number"
                          value={testUpiAmount}
                          onChange={(e) => setTestUpiAmount(e.target.value)}
                          className="w-32 px-3 py-1.5 text-sm rounded-xl bg-slate-800 border border-amber-500/50 text-amber-400 font-mono font-bold text-center mx-auto focus:outline-none"
                        />
                      </div>

                      {/* QR Display Card */}
                      <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border-4 border-amber-500/30 mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={upiQrImageSrc}
                          alt="Dynamic UPI QR Code"
                          className="w-48 h-48 mx-auto object-contain"
                        />
                        <div className="text-[10px] font-mono font-bold text-slate-900 mt-2">
                          Scan with any UPI App
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {settings.upiId}
                        </div>
                      </div>
                    </div>

                    <div className="w-full mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={copyUpiIntent}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-mono"
                      >
                        {copiedUpiUrl ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedUpiUrl ? "Copied!" : "Copy Intent URL"}</span>
                      </button>

                      <span className="text-xs font-mono font-bold text-amber-400">
                        {formatINR(parseFloat(testUpiAmount) || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TAB 4: THERMAL PRINTERS ---------------- */}
            {activeTab === "hardware" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>Thermal Hardware Calibration &amp; Test Lab</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Test and calibrate ESC/POS thermal output directly in your browser without wasting paper
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 80mm Bill Printer */}
                    <div className="bg-slate-50 dark:bg-slate-950/70 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                            80mm Customer Tax Receipt
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Width: 80mm (300px)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                          Features Cafe Header, GSTIN, FSSAI, itemized orders with portion variants, CGST/SGST 5%, embedded Dynamic UPI QR Code, and guest WiFi credentials.
                        </p>

                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                          <div>• Font: Monospace high-contrast</div>
                          <div>• Cut Command: GS V 66 0 (Full cut)</div>
                          <div>• QR Support: Native image rastering</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerTestPrint("80mm")}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Test Print 80mm Receipt</span>
                      </button>
                    </div>

                    {/* 58mm Kitchen Ticket Printer */}
                    <div className="bg-slate-50 dark:bg-slate-950/70 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                            58mm Kitchen Order Token (KOT)
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Width: 58mm (220px)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                          Kitchen-optimized ticket stripped of all financial pricing and taxes. Displays ONLY: KOT #, Order #, Date/Time, Item Name, Quantity, and Kitchen Notes.
                        </p>

                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                          <div>• Strip Prices: Guaranteed 100% no-price</div>
                          <div>• Font: Extra bold large monospace</div>
                          <div>• Cut Command: Auto partial cut</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerTestPrint("58mm")}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Test Print 58mm Kitchen KOT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TAB 5: WHATSAPP NOTIFICATIONS ---------------- */}
            {activeTab === "notifications" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp Cloud API Dispatch Logs</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Live audit of asynchronous digital receipt jobs enqueued on checkout
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search phone or order #..."
                        value={notifSearch}
                        onChange={(e) => setNotifSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Order #</th>
                          <th className="px-4 py-3">Recipient Phone</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Digital Bill URL</th>
                          <th className="px-4 py-3 text-right">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {filteredNotifs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                              {notifs.length === 0
                                ? "No notification dispatches recorded yet. Punch an order in POS to trigger WhatsApp job."
                                : `No notifications match "${notifSearch}".`}
                            </td>
                          </tr>
                        ) : (
                          filteredNotifs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString("en-IN")}
                              </td>

                              <td className="px-4 py-3 font-bold text-amber-400">
                                #{log.orderNumber}
                              </td>

                              <td className="px-4 py-3 text-slate-300">
                                {log.recipientPhone} ({log.customerName})
                              </td>

                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold text-[11px]">
                                  <Check className="w-3 h-3" />
                                  <span>{log.statusCode} {log.status}</span>
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <Link
                                  href={log.billUrl}
                                  target="_blank"
                                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                                >
                                  <span>View Bill</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>

                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedNotif(log)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans transition-colors"
                                >
                                  Payload
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TAB 6: DATA & ZERO CLOUD LOCK-IN ---------------- */}
            {activeTab === "database" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backup & Portability Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">
                            Complete Store Data Backup
                          </h3>
                          <p className="text-xs text-slate-400">
                            Download all store records in standard JSON
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        Exports your entire catalog, portion pricing, historical orders, KOT tickets, loyalty point balances, coupons, and B2B invoices in standard open JSON format. Zero lock-in guaranteed.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Store Backup JSON</span>
                    </button>
                  </div>

                  {/* Clean Reset Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">
                            Restore Default Store Data
                          </h3>
                          <p className="text-xs text-slate-400">
                            Re-initialize with default menu catalog and sample orders
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        Resets your local environment back to the clean starter menu, sample orders, active coupons, and customer loyalty accounts.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-slate-300 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset to Clean Starter Data</span>
                    </button>
                  </div>
                </div>

                {/* Architecture Info Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">
                      Zero Cloud Lock-in Architecture (PostgreSQL Ready)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This POS application is strictly designed with zero proprietary cloud dependencies. When deployed on your own VPS or cloud provider, simply set <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">DATABASE_URL=&quot;postgresql://...&quot;</code> and run <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">npx prisma db push</code>. The data layer seamlessly switches to native PostgreSQL with zero code changes required.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ---------------- RESET CONFIRMATION MODAL ---------------- */}
        {showResetModal && (
          <Portal>
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print animate-in fade-in duration-150"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowResetModal(false);
              }}
            >
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Reset Store to Default State?
                    </h3>
                    <p className="text-xs text-slate-400">
                      This will restore initial menu catalog and sample orders
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  All custom created orders, custom invoices, and modified menu items will be re-initialized to the clean default starter catalog. This action cannot be undone.
                </p>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    Yes, Reset Everything
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* ---------------- WHATSAPP PAYLOAD MODAL ---------------- */}
        {selectedNotif && (
          <Portal>
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedNotif(null);
              }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
            >
              <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>WhatsApp Message Payload (#{selectedNotif.orderNumber})</span>
                  </h3>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs whitespace-pre-wrap text-emerald-400 leading-relaxed overflow-y-auto max-h-96">
                  {selectedNotif.messagePayload}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
    </>
  );
}
