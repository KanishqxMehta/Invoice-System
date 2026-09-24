"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  Monitor,
  ChefHat,
  Users,
  Tag,
  Settings,
  FileText,
  Layers,
  Bike,
  ChevronDown,
  PlusCircle,
  UploadCloud,
  X,
  Store,
  Clock,
  LayoutGrid,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { getMenuItems, getSettings, getZomatoOrders } from "@/lib/storage";
import ThemeToggle from "./ThemeToggle";
import ZomatoOrderModal from "./ZomatoOrderModal";

export default function Navbar() {
  const pathname = usePathname();
  const [posItemCount, setPosItemCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isZomatoModalOpen, setIsZomatoModalOpen] = useState<boolean>(false);
  const [zomatoCount, setZomatoCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showNavbarClock, setShowNavbarClock] = useState<boolean>(false);
  const [cafeName, setCafeName] = useState<string>("Chandni Chowk Cheese Cafe");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hide nav ONLY on customer digital bill view (e.g. mobile receipt sent via WhatsApp)
  const isDedicatedCustomerReceipt = pathname.startsWith("/bill/");

  // Live ticking IST clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update count of items enabled for POS
  useEffect(() => {
    setIsMounted(true);
    const updateCount = () => {
      const items = getMenuItems();
      const active = items.filter((i) => i.selectedForPOS !== false).length;
      setPosItemCount(active);
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, [pathname]);

  // Update count of Zomato delivery reference orders
  useEffect(() => {
    const updateZomato = () => {
      try {
        const orders = getZomatoOrders();
        setZomatoCount(orders.length);
      } catch (e) {}
    };
    updateZomato();
    window.addEventListener("storage", updateZomato);
    return () => window.removeEventListener("storage", updateZomato);
  }, [pathname]);

  // Sync settings (showNavbarClock, cafeName)
  useEffect(() => {
    const updateSettings = () => {
      try {
        const s = getSettings();
        setShowNavbarClock(Boolean(s.showNavbarClock));
        setCafeName(s.cafeName || "Chandni Chowk Cheese Cafe");
      } catch (err) {
        setShowNavbarClock(false);
      }
    };
    updateSettings();
    window.addEventListener("storage", updateSettings);
    return () => window.removeEventListener("storage", updateSettings);
  }, []);

  // Auto-close expanded menu on route change
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  // ESC key closes expanded menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isDedicatedCustomerReceipt) {
    return null;
  }

  const handleModulesMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleModulesMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 250);
  };

  const handleOtherNavMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(false);
  };

  const isActive = (href: string) => {
    if (href === "/pos") {
      return pathname === "/" || pathname === "/pos";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 select-none shadow-xs dark:shadow-md transition-colors duration-150">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-14 gap-2">
          {/* Brand Logo & Station ID - ALIGNED LEFT */}
          <div
            className="flex items-center gap-2.5 min-w-0 justify-start"
            onMouseEnter={handleOtherNavMouseEnter}
          >
            <Link
              href="/pos"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 group focus:outline-none min-w-0 flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform font-black flex-shrink-0">
                <Coffee className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  <span className="truncate">{cafeName}</span>
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex-shrink-0">
                    POS
                  </span>
                </div>
                <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>Terminal 01 • Live</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Dock - ALIGNED CENTER (Screens & Modules) */}
          <nav className="flex items-center justify-center">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-inner transition-colors">
              {/* POS */}
              <Link
                href="/pos"
                onMouseEnter={handleOtherNavMouseEnter}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive("/pos")
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>POS</span>
              </Link>

              {/* Menu */}
              <Link
                href="/menu"
                onMouseEnter={handleOtherNavMouseEnter}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive("/menu")
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Menu</span>
                <span
                  suppressHydrationWarning
                  className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700"
                >
                  {isMounted ? posItemCount : 0}
                </span>
              </Link>

              {/* Invoices */}
              <Link
                href="/invoices"
                onMouseEnter={handleOtherNavMouseEnter}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive("/invoices")
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invoices</span>
              </Link>

              {/* KDS */}
              <Link
                href="/kds"
                onMouseEnter={handleOtherNavMouseEnter}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive("/kds")
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kitchen</span>
              </Link>

              {/* Modules Dropdown Trigger */}
              <div
                className="relative"
                onMouseEnter={handleModulesMouseEnter}
                onMouseLeave={handleModulesMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isExpanded
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  }`}
                  title="Hover or click to expand all modules (Customers, Coupons, Settings, etc.)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modules</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-white" : "text-slate-400"
                    }`}
                  />
                </button>
              </div>

              {/* Zomato Reference Orders Button - TO THE RIGHT OF MODULES */}
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setIsZomatoModalOpen(true);
                }}
                onMouseEnter={handleOtherNavMouseEnter}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 shadow-xs active:scale-95"
                title="Add & View Zomato Orders (Reference & Bill Tracking)"
              >
                <Bike className="w-3.5 h-3.5 text-red-500" />
                <span>Zomato</span>
                {isMounted && zomatoCount > 0 && (
                  <span
                    suppressHydrationWarning
                    className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold"
                  >
                    {zomatoCount}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Status Controls - ALIGNED RIGHT */}
          <div
            className="flex items-center justify-end gap-2 min-w-0"
            onMouseEnter={handleOtherNavMouseEnter}
          >
            {/* Live IST Clock (Controlled by Settings, Hidden by default) */}
            {showNavbarClock && currentTime && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono shadow-xs whitespace-nowrap flex-shrink-0 animate-in fade-in duration-200"
                title="Current time (IST)"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentTime}</span>
              </div>
            )}

            {/* Theme Toggle (Dark / Light mode) */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* ---------------- EXPANDED MEGA-MENU DECK ON MODULES HOVER/CLICK ---------------- */}
      {isExpanded && (
        <>
          {/* Backdrop Blur to make menu pop */}
          <div
            className="fixed inset-0 top-14 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsExpanded(false)}
          />

          <div
            onMouseEnter={handleModulesMouseEnter}
            onMouseLeave={handleModulesMouseLeave}
            className="absolute top-full left-0 right-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-slate-900 dark:text-white transition-colors"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              {/* Header Bar inside expanded deck */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="uppercase tracking-widest text-[11px]">
                    Cafe Operations &amp; Management Deck
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <span className="hidden sm:inline">
                    Keyboard Shortcut: Press{" "}
                    <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-300">
                      /
                    </kbd>{" "}
                    in POS for quick product search
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Close menu (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Categorized Modules Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Column 1: Sales & Invoicing */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block px-1">
                    ⚡ Sales &amp; Billing
                  </span>

                  <Link
                    href="/pos"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/pos")
                        ? "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Cashier POS</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Press /
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        High-speed checkout, portion sizing (Half/Full), modifiers &amp; 1-click KOT punch.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/invoices"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/invoices")
                        ? "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Sales &amp; Receipts</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Register
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        POS counter receipts, Dine-in &amp; Takeaway bills, Zomato reconciliation &amp; customer slips.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Column 2: Kitchen & Fulfillment */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block px-1">
                    🍳 Kitchen &amp; Fulfillment
                  </span>

                  <Link
                    href="/kds"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/kds")
                        ? "bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Kitchen Display (KDS)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          Live
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Real-time order prep tickets with 10m yellow / 15m red urgency alerts.
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setIsZomatoModalOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/40 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-red-700 dark:text-red-300">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                        <span>Zomato Reference &amp; Bills</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold">
                        Open
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Add &amp; track Zomato items for reference, bills &amp; sales reports.
                    </p>
                  </button>
                </div>

                {/* Column 3: Dishes & Catalog */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block px-1">
                    📋 Catalog &amp; Menu
                  </span>

                  <Link
                    href="/menu"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/menu")
                        ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Menu Dashboard</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          {posItemCount} Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Select POS items, configure Single vs Half/Full plate pricing, and add custom modifiers.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/menu"
                    onClick={() => setIsExpanded(false)}
                    className="group flex items-start gap-3 p-3 rounded-2xl border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Import / Export Menu</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Upload CSV/JSON supplier spreadsheets or export complete menu backup in 1 click.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Column 4: CRM & Store Operations */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block px-1">
                    👥 CRM &amp; Settings
                  </span>

                  <Link
                    href="/customers"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/customers")
                        ? "bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Loyalty &amp; Customers</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Phone lookup, loyalty cashback ledger &amp; digital WhatsApp bills.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/coupons"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/coupons")
                        ? "bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Coupons &amp; Offers</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Create promo vouchers with percentage or flat rupee discounts.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isActive("/settings")
                        ? "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>Store &amp; System Settings</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Cafe profile, GSTIN, Bank details, UPI QR, thermal printers &amp; data backup.
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Bottom System Banner */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Zero Cloud Lock-in Active</span>
                  </span>
                  <span>•</span>
                  <span>Hybrid LocalStorage / PostgreSQL Ready</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Currency:</span>
                  <strong className="text-amber-600 dark:text-amber-400">INR (₹)</strong>
                  <span>•</span>
                  <span className="text-slate-500 dark:text-slate-400">Delivery:</span>
                  <strong className="text-red-600 dark:text-red-400 font-sans">Zomato Only</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dedicated Zomato Order & Reference Modal */}
      <ZomatoOrderModal
        isOpen={isZomatoModalOpen}
        onClose={() => setIsZomatoModalOpen(false)}
      />
    </header>
  );
}
