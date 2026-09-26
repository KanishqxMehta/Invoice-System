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
  Layers,
  Bike,
  ChevronDown,
  UploadCloud,
  X,
  Store,
  Clock,
  LayoutGrid,
  ShieldCheck,
  Receipt,
  LogOut,
  Check,
  Search,
} from "lucide-react";
import { getMenuItems, getSettings, getZomatoOrders } from "@/lib/storage";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";
import ZomatoOrderModal from "./ZomatoOrderModal";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isSuperAdmin, activeCafe, activeCafeId, allCafes, switchCafe, logout } = useAuth();

  const [posItemCount, setPosItemCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isZomatoModalOpen, setIsZomatoModalOpen] = useState<boolean>(false);
  const [zomatoCount, setZomatoCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showNavbarClock, setShowNavbarClock] = useState<boolean>(false);
  const [cafeName, setCafeName] = useState<string>("Chandni Chowk Cheese Cafe");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);

  // Hide nav on customer digital bill view & login screen
  const isDedicatedCustomerReceipt = pathname.startsWith("/bill/");
  const isLoginPage = pathname === "/login";

  // Outside click listener for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target as Node)) {
        setIsBranchMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Live ticking IST clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
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
  }, [activeCafeId]);

  // Auto-close menus on route change
  useEffect(() => {
    setIsExpanded(false);
    setIsUserMenuOpen(false);
    setIsBranchMenuOpen(false);
    setBranchSearch("");
  }, [pathname]);

  // ESC key closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
        setIsUserMenuOpen(false);
        setIsBranchMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isDedicatedCustomerReceipt || isLoginPage) {
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

  const filteredCafes = allCafes
    .filter((c) => c.role !== "SUPER_ADMIN")
    .filter((c) => 
      c.cafeName.toLowerCase().includes(branchSearch.toLowerCase()) || 
      c.branchCode.toLowerCase().includes(branchSearch.toLowerCase()) ||
      c.location.city.toLowerCase().includes(branchSearch.toLowerCase())
    );

  const totalBranches = allCafes.filter(c => c.role !== "SUPER_ADMIN").length;

  if (!isMounted) {
    return (
      <header className="no-print sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg h-14 border-b border-slate-200 dark:border-slate-800/80 shadow-sm" />
    );
  }

  return (
    <>
      <header className="no-print sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors duration-150 select-none">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center h-14 gap-4">
            {/* Brand Logo & Station ID - ALIGNED LEFT */}
            <div
              className="flex items-center gap-3 min-w-0 justify-start"
              onMouseEnter={handleOtherNavMouseEnter}
            >
              <Link
                href={isSuperAdmin ? "/admin" : "/pos"}
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-2.5 group focus:outline-none min-w-0 flex-shrink-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all font-black flex-shrink-0">
                  <Coffee className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-1.5 font-bold text-[13px] tracking-tight text-slate-900 dark:text-white truncate">
                    <span className="truncate">
                      {isSuperAdmin && activeCafeId === "ALL_CAFES" ? "All Branches HQ" : (activeCafe ? activeCafe.cafeName : cafeName)}
                    </span>
                    {activeCafeId !== "ALL_CAFES" && (
                      <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex-shrink-0 font-medium">
                        {activeCafe ? activeCafe.branchCode : "POS"}
                      </span>
                    )}
                  </div>
                  {activeCafeId !== "ALL_CAFES" && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)] inline-block animate-pulse" />
                      <span>{activeCafe?.location.city || "Terminal 01"} • Live</span>
                    </div>
                  )}
                  {isSuperAdmin && activeCafeId === "ALL_CAFES" && (
                     <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)] inline-block animate-pulse" />
                     <span>Monitoring {totalBranches} Branches</span>
                   </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Navigation Dock - ALIGNED CENTER (Screens & Modules) */}
            <nav className="hidden md:flex items-center justify-center">
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-sm transition-colors">
                {/* Admin HQ Link (Prominently displayed for Super Admin) */}
                {isSuperAdmin && (
                  <Link
                    href="/admin"
                    onMouseEnter={handleOtherNavMouseEnter}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isActive("/admin")
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin HQ</span>
                  </Link>
                )}

                {/* Show POS modules ONLY if a specific cafe is selected (not ALL_CAFES) */}
                {activeCafeId !== "ALL_CAFES" && (
                  <>
                    {/* POS */}
                    <Link
                      href="/pos"
                      onMouseEnter={handleOtherNavMouseEnter}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive("/pos")
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>POS</span>
                    </Link>

                    {/* Kitchen link removed from top-level dock. It is accessible via Modules. */}

                    {/* Modules Dropdown Trigger */}
                    <div
                      className="relative"
                      onMouseEnter={handleModulesMouseEnter}
                      onMouseLeave={handleModulesMouseLeave}
                    >
                      <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          isExpanded
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4 text-amber-500" />
                        <span>Modules</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Zomato Orders */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        setIsZomatoModalOpen(true);
                      }}
                      onMouseEnter={handleOtherNavMouseEnter}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 shadow-sm ml-1"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Zomato</span>
                      {isMounted && zomatoCount > 0 && (
                        <span
                          suppressHydrationWarning
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-mono bg-red-500 text-white shadow-sm"
                        >
                          {zomatoCount}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </nav>

            {/* Status & Auth Controls - ALIGNED RIGHT */}
            <div
              className="flex items-center justify-end gap-3 min-w-0"
              onMouseEnter={handleOtherNavMouseEnter}
            >
              {/* Branch Switcher (for Super Admin) */}
              {isSuperAdmin && (
                <div className="relative" ref={branchMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  >
                    <Store className="w-4 h-4 text-amber-500" />
                    <span className="hidden xl:inline truncate max-w-[130px]">
                      {activeCafeId === "ALL_CAFES" ? "All Branches HQ" : activeCafe?.branchCode}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>

                  {isBranchMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 pl-1">
                          Switch Branch Terminal
                        </div>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search branches..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            switchCafe("ALL_CAFES");
                            setIsBranchMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            activeCafeId === "ALL_CAFES"
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 text-lg leading-none">👑</span>
                            <span>All Branches (HQ Overview)</span>
                          </div>
                          {activeCafeId === "ALL_CAFES" && <Check className="w-4 h-4 text-amber-500" />}
                        </button>

                        {filteredCafes.map((cafe) => (
                          <button
                            key={cafe.id}
                            type="button"
                            onClick={() => {
                              switchCafe(cafe.id);
                              setIsBranchMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              activeCafeId === cafe.id
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="truncate pr-3">
                              <div className="truncate font-medium text-slate-900 dark:text-white">
                                {cafe.cafeName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {cafe.branchCode} • {cafe.location.city}
                              </div>
                            </div>
                            {activeCafeId === cafe.id && (
                              <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </button>
                        ))}

                        {filteredCafes.length === 0 && (
                          <div className="px-3 py-4 text-center text-xs text-slate-500">
                            No branches found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live IST Clock */}
              {showNavbarClock && currentTime && (
                <div
                  className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium font-mono px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Current time (IST)"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentTime}</span>
                </div>
              )}

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Profile & Logout Dropdown */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="hidden sm:flex flex-col items-end justify-center">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                        {isSuperAdmin ? "Master Admin" : (user.managerName || user.username)}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                        {isSuperAdmin ? "Headquarters" : "Branch Manager"}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600">
                      {isSuperAdmin ? "HQ" : (user.managerName ? user.managerName.slice(0, 2).toUpperCase() : user.username.slice(0, 2).toUpperCase())}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 flex-shrink-0">
                           {isSuperAdmin ? "HQ" : (user.managerName ? user.managerName.slice(0, 2).toUpperCase() : user.username.slice(0, 2).toUpperCase())}
                         </div>
                         <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {isSuperAdmin ? "Master Administrator" : (user.managerName || user.username)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isSuperAdmin ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                              {isSuperAdmin ? "👑 Super Admin" : "Branch Role"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
                        {isSuperAdmin ? "Global HQ Access" : (activeCafe?.cafeName || user.cafeName)}
                      </div>

                      <div className="space-y-1">
                        {isSuperAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            <span>Admin Control Panel</span>
                          </Link>
                        )}

                        <Link
                          href="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Store Settings</span>
                        </Link>
                      </div>

                      <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- EXPANDED MEGA-MENU DECK ON MODULES HOVER/CLICK ---------------- */}
        {isExpanded && (
        <>
          {/* Backdrop Blur to make menu pop */}
          <div
            className="fixed inset-0 top-14 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsExpanded(false)}
          />

          <div
            onMouseEnter={handleModulesMouseEnter}
            onMouseLeave={handleModulesMouseLeave}
            className="absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 text-slate-900 dark:text-white transition-colors"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              {/* Header Bar inside expanded deck */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60 mb-5 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <LayoutGrid className="w-4 h-4 text-amber-500" />
                  <span className="uppercase tracking-widest text-[11px]">
                    Cafe Operations & Management
                  </span>
                </div>

                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                  <span className="hidden sm:flex items-center gap-1.5 text-[11px]">
                    Quick Search
                    <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold shadow-sm">
                      /
                    </kbd>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Close menu (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Categorized Modules Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Column 1: Sales & Invoicing */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Sales & Billing
                    </span>
                  </div>

                  <Link
                    href="/pos"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/pos")
                        ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Cashier POS
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        High-speed checkout, sizing, modifiers & 1-click KOT punch.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/invoices"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/invoices")
                        ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Sales & Receipts
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Counter receipts, Dine-in & Takeaway bills.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Column 2: Kitchen & Fulfillment */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Kitchen & Delivery
                    </span>
                  </div>

                  <Link
                    href="/kds"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/kds")
                        ? "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Kitchen Display (KDS)
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Real-time order prep tickets with urgency alerts.
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setIsZomatoModalOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                          Zomato Operations
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Add & track Zomato items for reference and bills.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Column 3: Dishes & Catalog */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Catalog & Menu
                    </span>
                  </div>

                  <Link
                    href="/menu"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/menu")
                        ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Menu Dashboard
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Manage POS items, pricing, and custom modifiers.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/menu"
                    onClick={() => setIsExpanded(false)}
                    className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Import / Export
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Upload CSV/JSON spreadsheets or export backups.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Column 4: CRM & Store Operations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Operations & Setup
                    </span>
                  </div>

                  {isSuperAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsExpanded(false)}
                      className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                        isActive("/admin")
                          ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                          HQ Multi-Store Panel
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Live monitoring of all branches & revenue.
                        </p>
                      </div>
                    </Link>
                  )}

                  <Link
                    href="/customers"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/customers")
                        ? "bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Loyalty & Customers
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Phone lookup, loyalty ledger & WhatsApp bills.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/coupons"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/coupons")
                        ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Coupons & Offers
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsExpanded(false)}
                    className={`group flex items-start gap-3 p-3 rounded-2xl transition-all ${
                      isActive("/settings")
                        ? "bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                        Store Settings
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Bottom System Banner */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Zero Cloud Lock-in</span>
                  </span>
                  <span className="opacity-50">•</span>
                  <span>Hybrid LocalStorage / DB Ready</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500">Currency:</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-sans">INR (₹)</strong>
                  <span className="opacity-50">•</span>
                  <span className="text-slate-500">Delivery:</span>
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
  </>
  );
}
