"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield, Building, MapPin, Users, Phone, Plus, RefreshCw, TrendingUp,
  Receipt, UtensilsCrossed, ChefHat, Monitor, Edit3, Trash2, CheckCircle2,
  AlertTriangle, Clock, Key, Search, ChevronRight, X, Store, ArrowRight,
  Activity, BarChart3, Wallet, CreditCard, LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  getAllCafeAccounts, getOnlyCafeBranches, createCafeAccount,
  updateCafeAccount, deleteCafeAccount, CreateCafeAccountInput,
} from "@/lib/auth";
import { getAllOrdersRaw, getAllKOTTicketsRaw } from "@/lib/storage";
import { CafeAccount, CafeStatus } from "@/lib/types";
import { formatINR } from "@/lib/calculator";
import Portal from "@/components/Portal";

// ─── Helper: Default blank form values ───
function getDefaultFormData(): CreateCafeAccountInput {
  return {
    username: "", password: "", pin: "1234", cafeName: "", branchCode: "", tagline: "",
    location: { addressLine: "", landmark: "", city: "Delhi", state: "Delhi", pincode: "" },
    managerName: "", contactPhone: "+91 ", contactEmail: "", gstin: "", fssaiNumber: "",
    tableCount: 12, seatingCapacity: 48, upiId: "", upiPayeeName: "", status: "ACTIVE",
    openingHours: "09:00 AM - 11:00 PM",
  };
}

// ─── Helper: Convert CafeAccount → form values for editing ───
function cafeToFormData(cafe: CafeAccount): CreateCafeAccountInput {
  return {
    username: cafe.username, password: "", pin: cafe.pin || "", cafeName: cafe.cafeName,
    branchCode: cafe.branchCode, tagline: cafe.tagline || "",
    location: { ...cafe.location },
    managerName: cafe.managerName, contactPhone: cafe.contactPhone, contactEmail: cafe.contactEmail,
    gstin: cafe.gstin, fssaiNumber: cafe.fssaiNumber,
    tableCount: cafe.tableCount, seatingCapacity: cafe.seatingCapacity,
    upiId: cafe.upiId, upiPayeeName: cafe.upiPayeeName,
    status: cafe.status, openingHours: cafe.openingHours || "",
  };
}

// ─── Shared input class ───
const inputCls = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors";

// ═══════════════════════════════════════════════════════════════
export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isSuperAdmin, switchCafe, refreshAuth } = useAuth();

  // ─── Core State ───
  const [isMounted, setIsMounted] = useState(false);
  const [branches, setBranches] = useState<CafeAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Modal State ───
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCafe, setEditingCafe] = useState<CafeAccount | null>(null);
  const [deletingCafe, setDeletingCafe] = useState<CafeAccount | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // ─── Form State ───
  const [formData, setFormData] = useState<CreateCafeAccountInput>(getDefaultFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Activity Feed Filter ───
  const [feedBranchFilter, setFeedBranchFilter] = useState("ALL");

  // ─── Orders & KOTs stored in state to avoid SSR/client localStorage mismatch ───
  const [allOrders, setAllOrders] = useState<ReturnType<typeof getAllOrdersRaw>>([]);
  const [allKots, setAllKots] = useState<ReturnType<typeof getAllKOTTicketsRaw>>([]);

  // ─── Data Loading (only runs client-side after mount) ───
  const loadData = useCallback(() => {
    setIsRefreshing(true);
    try {
      setBranches(getOnlyCafeBranches());
      setAllOrders(getAllOrdersRaw());
      setAllKots(getAllKOTTicketsRaw());
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadData();
    window.addEventListener("storage", loadData);
    window.addEventListener("auth-changed", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("auth-changed", loadData);
    };
  }, [loadData]);

  // ─── Escape key handler for modals ───
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deletingCafe) setDeletingCafe(null);
        else if (isFormModalOpen) closeFormModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [deletingCafe, isFormModalOpen]);

  // ─── Toast ───
  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // ─── Computed: Network KPIs (safe — allOrders/allKots are [] until mounted) ───
  const totalNetworkSales = allOrders
    .filter((o) => o.paymentStatus === "PAID" || !o.paymentStatus)
    .reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  const totalNetworkOrders = allOrders.length;
  const activeKotsCount = allKots.filter((k) => k.status !== "COMPLETED").length;
  const activeTablesCount = allOrders.filter(
    (o) => o.paymentStatus === "PENDING" && o.tableNumber
  ).length;

  // ─── Computed: Filtered branches ───
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.cafeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Computed: Status counts for filter tabs ───
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: branches.length, ACTIVE: 0, INACTIVE: 0, MAINTENANCE: 0 };
    branches.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [branches]);

  // ─── Computed: Branch stats ───
  const getBranchStats = (branchId: string) => {
    const branchOrders = allOrders.filter((o) => (o.cafeId || "cafe-delhi-flagship") === branchId);
    const paidOrders = branchOrders.filter((o) => o.paymentStatus === "PAID" || !o.paymentStatus);
    const todaySales = paidOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const activeKots = allKots.filter((k) => (k.cafeId || "cafe-delhi-flagship") === branchId && k.status !== "COMPLETED").length;
    const occupiedTables = branchOrders.filter((o) => o.paymentStatus === "PENDING" && o.tableNumber).length;
    return { todaySales, ordersCount: branchOrders.length, activeKots, occupiedTables };
  };

  const maxSales = useMemo(() => {
    return Math.max(0, ...branches.map(b => getBranchStats(b.id).todaySales));
  }, [branches, allOrders]);

  // ─── Computed: Filtered activity feed ───
  const feedOrders = useMemo(() => {
    const orders = feedBranchFilter === "ALL"
      ? allOrders
      : allOrders.filter((o) => (o.cafeId || "cafe-delhi-flagship") === feedBranchFilter);
    return orders.slice(0, 20);
  }, [allOrders, feedBranchFilter]);

  // ─── Actions ───
  const handleLaunchStore = (branchId: string, route: "/pos" | "/kds" | "/invoices" = "/pos") => {
    switchCafe(branchId);
    router.push(route);
  };

  // ─── Form Modal Actions ───
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCafe(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    setEditingCafe(null);
    setFormData(getDefaultFormData());
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (cafe: CafeAccount) => {
    setEditingCafe(cafe);
    setFormData(cafeToFormData(cafe));
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingCafe) {
        // ─── Edit Mode ───
        const updates: Partial<CafeAccount> = {
          cafeName: formData.cafeName,
          tagline: formData.tagline,
          location: formData.location,
          managerName: formData.managerName,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          gstin: formData.gstin,
          fssaiNumber: formData.fssaiNumber,
          tableCount: formData.tableCount,
          seatingCapacity: formData.seatingCapacity,
          upiId: formData.upiId,
          upiPayeeName: formData.upiPayeeName,
          status: formData.status,
          openingHours: formData.openingHours,
        };
        if (formData.password.trim()) updates.password = formData.password;
        if (formData.pin) updates.pin = formData.pin;
        if (formData.username !== editingCafe.username) updates.username = formData.username;

        updateCafeAccount(editingCafe.id, updates);
        showSuccess(`Branch "${formData.branchCode}" updated successfully!`);
      } else {
        // ─── Create Mode ───
        createCafeAccount({
          ...formData,
          upiPayeeName: formData.upiPayeeName || formData.cafeName,
          upiId: formData.upiId || `${formData.username.toLowerCase()}@okhdfcbank`,
        });
        showSuccess(`Branch "${formData.branchCode}" created successfully!`);
      }
      loadData();
      refreshAuth();
      closeFormModal();
    } catch (err: any) {
      setFormError(err.message || "Failed to save branch.");
    }
  };

  // ─── Delete Actions ───
  const handleDelete = () => {
    if (!deletingCafe) return;
    try {
      deleteCafeAccount(deletingCafe.id);
      showSuccess(`Branch "${deletingCafe.branchCode}" deleted.`);
      loadData();
      refreshAuth();
      setDeletingCafe(null);
    } catch (err: any) {
      setFormError(null);
      showSuccess(`Error: ${err.message}`);
      setDeletingCafe(null);
    }
  };

  // ─── Form helpers ───
  const updateField = (key: keyof CreateCafeAccountInput, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const updateLocation = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-full min-h-0 overflow-hidden">

      {/* ══════ HEADER ══════ */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-30 px-4 sm:px-6 py-4 shadow-sm flex-shrink-0">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
              <Activity className="w-4 h-4" />
              <span>Headquarters Command Center</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
              <span className="text-emerald-600 dark:text-emerald-400 font-mono tracking-normal">Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Network Operations
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 group"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════ SUCCESS TOAST ══════ */}
      {actionSuccessMsg && (
        <div className="w-full px-4 sm:px-6 pt-4 flex-shrink-0">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in max-w-[1400px] mx-auto">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ══════ MAIN DASHBOARD LAYOUT ══════ */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden w-full max-w-[1400px] mx-auto">

        {/* ── LEFT COLUMN (Metrics & Branches) ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 min-w-0 space-y-6 custom-scrollbar">

          {/* Top KPI Ribbons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Gross Sales", value: formatINR(totalNetworkSales), icon: Wallet, color: "amber", sub: "Across all branches", subIcon: TrendingUp },
              { label: "Total Orders", value: totalNetworkOrders, icon: Receipt, color: "indigo", sub: "Dine-In & Takeaway" },
              { label: "Seated", value: activeTablesCount, icon: Users, color: "emerald", sub: "Active tables" },
              { label: "Kitchen", value: activeKotsCount, icon: ChefHat, color: "rose", sub: "Pending KOTs" },
            ].map((kpi) => (
              <div key={kpi.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${kpi.color}-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out`} />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 text-${kpi.color}-500`} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpi.value}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  {kpi.subIcon && <kpi.subIcon className="w-3 h-3 text-emerald-500" />}
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Comparison Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Branch Revenue Comparison
            </h3>
            <div className="space-y-4">
              {branches.map(branch => {
                const stats = getBranchStats(branch.id);
                const pct = maxSales > 0 ? (stats.todaySales / maxSales) * 100 : 0;
                return (
                  <div key={branch.id} className="flex items-center gap-3">
                    <div className="w-24 flex-shrink-0 text-right text-xs font-bold text-slate-600 dark:text-slate-400 truncate" title={branch.cafeName}>
                      {branch.branchCode}
                    </div>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-20 flex-shrink-0 text-left text-xs font-mono font-bold">
                      {formatINR(stats.todaySales)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch Locations Section */}
          <div>
            {/* Header + Search + Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-500" />
                Branch Locations ({filteredBranches.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" placeholder="Search branches..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {(["ALL", "ACTIVE", "INACTIVE", "MAINTENANCE"] as const).map((status) => {
                const isActive = selectedStatusFilter === status;
                const count = statusCounts[status] || 0;
                const colors: Record<string, string> = {
                  ALL: isActive ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                  ACTIVE: isActive ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
                  INACTIVE: isActive ? "bg-rose-600 text-white" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
                  MAINTENANCE: isActive ? "bg-amber-600 text-white" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
                };
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${colors[status]}`}
                  >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                    <span className={`ml-1.5 text-[10px] font-mono ${isActive ? "opacity-80" : "opacity-60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Branch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
              {filteredBranches.map(branch => {
                const stats = getBranchStats(branch.id);
                return (
                  <div key={branch.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-amber-500/50 transition-all flex flex-col group shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {branch.branchCode}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${branch.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : branch.status === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${branch.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : branch.status === 'MAINTENANCE' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {branch.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{branch.cafeName}</h4>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {branch.location.city}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(branch)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-colors"
                          title="Edit branch details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCafe(branch)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                          title="Delete branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleLaunchStore(branch.id, "/pos")}
                          className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors flex-shrink-0"
                          title="Launch POS"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Sales</div>
                        <div className="text-xs font-mono font-bold mt-0.5">{formatINR(stats.todaySales)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Orders</div>
                        <div className="text-xs font-mono font-bold mt-0.5">{stats.ordersCount}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 mt-auto">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {branch.managerName.split(' ')[0]}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleLaunchStore(branch.id, "/kds")} className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-medium text-slate-600 dark:text-slate-400">KDS</button>
                        <button onClick={() => handleLaunchStore(branch.id, "/invoices")} className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-medium text-slate-600 dark:text-slate-400">Bills</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredBranches.length === 0 && (
                <div className="col-span-full text-center py-12 text-sm text-slate-400">
                  No branches match your search or filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Live Activity Feed) ── */}
        <div className="xl:w-[380px] flex-shrink-0 flex flex-col h-full overflow-hidden px-4 sm:px-6 xl:px-0 xl:pr-6 py-6 xl:border-l xl:border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Activity</h3>
                  <p className="text-[10px] text-slate-500">Real-time orders</p>
                </div>
              </div>
              {/* Branch filter dropdown */}
              <select
                value={feedBranchFilter}
                onChange={(e) => setFeedBranchFilter(e.target.value)}
                className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.branchCode}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {feedOrders.map(order => {
                const branch = branches.find(b => b.id === order.cafeId);
                const isPaid = order.paymentStatus === 'PAID';
                return (
                  <div key={order.id} className="flex gap-3 items-start group">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          {formatINR(order.finalTotal)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-0.5 line-clamp-1">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                      </div>
                      <div className="text-[9px] text-slate-400 flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase font-bold tracking-wider">{branch?.branchCode || 'HQ'}</span>
                          {order.tableNumber && (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">T-{order.tableNumber}</span>
                          )}
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors">
                          {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {feedOrders.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-10">
                  No activity{feedBranchFilter !== "ALL" ? " for this branch" : ""}.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: Create / Edit Branch Form
         ══════════════════════════════════════════════════════════ */}
      {isFormModalOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-form-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={(e) => { if (e.target === e.currentTarget) closeFormModal(); }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full relative flex flex-col max-h-[88vh] shadow-2xl border border-slate-200 dark:border-slate-800">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div>
                  <h2 id="branch-form-title" className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingCafe ? `Edit Branch` : "Add New Branch"}
                  </h2>
                  {editingCafe && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{editingCafe.branchCode} · {editingCafe.location.city}</p>
                  )}
                </div>
                <button onClick={closeFormModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">

                {/* ─ Error Banner ─ */}
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* ─── SECTION: Identity ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5" /> Identity
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Cafe Name <span className="text-rose-500">*</span></label>
                      <input required autoFocus placeholder="e.g. Chandni Chowk Cheese Cafe" className={inputCls} value={formData.cafeName} onChange={e => updateField("cafeName", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Branch Code <span className="text-rose-500">*</span></label>
                      <input required placeholder="e.g. CC-DEL-01" className={`${inputCls} uppercase`} value={formData.branchCode} onChange={e => updateField("branchCode", e.target.value.toUpperCase())} readOnly={!!editingCafe} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Tagline</label>
                      <input placeholder="e.g. Pure Veg Since 1998" className={inputCls} value={formData.tagline} onChange={e => updateField("tagline", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Location ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Street Address</label>
                      <input placeholder="e.g. 12, Main Chandni Chowk Road" className={inputCls} value={formData.location.addressLine} onChange={e => updateLocation("addressLine", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Landmark</label>
                      <input placeholder="e.g. Opposite Town Hall" className={inputCls} value={formData.location.landmark} onChange={e => updateLocation("landmark", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">City <span className="text-rose-500">*</span></label>
                      <input required placeholder="City" className={inputCls} value={formData.location.city} onChange={e => updateLocation("city", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">State</label>
                      <input placeholder="State" className={inputCls} value={formData.location.state} onChange={e => updateLocation("state", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Pincode</label>
                      <input placeholder="110001" className={inputCls} value={formData.location.pincode} onChange={e => updateLocation("pincode", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Credentials ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5" /> Credentials
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Username <span className="text-rose-500">*</span></label>
                      <input required={!editingCafe} placeholder="login_id" className={inputCls} value={formData.username} onChange={e => updateField("username", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                        Password {!editingCafe && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        required={!editingCafe} type="password"
                        placeholder={editingCafe ? "Leave blank to keep" : "Password"}
                        className={inputCls} value={formData.password}
                        onChange={e => updateField("password", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Quick PIN</label>
                      <input placeholder="4-digit" maxLength={4} className={inputCls} value={formData.pin} onChange={e => updateField("pin", e.target.value.replace(/\D/g, "").slice(0, 4))} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Management ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Management
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Manager Name <span className="text-rose-500">*</span></label>
                      <input required placeholder="Full name" className={inputCls} value={formData.managerName} onChange={e => updateField("managerName", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Phone <span className="text-rose-500">*</span></label>
                      <input required placeholder="+91 98XXX XXXXX" className={inputCls} value={formData.contactPhone} onChange={e => updateField("contactPhone", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                      <input type="email" placeholder="manager@cafe.com" className={inputCls} value={formData.contactEmail} onChange={e => updateField("contactEmail", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Operations ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5" /> Operations
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Tables</label>
                      <input type="number" min={1} className={inputCls} value={formData.tableCount} onChange={e => updateField("tableCount", parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Seating</label>
                      <input type="number" min={1} className={inputCls} value={formData.seatingCapacity} onChange={e => updateField("seatingCapacity", parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Hours</label>
                      <input placeholder="09:00 AM - 11:00 PM" className={inputCls} value={formData.openingHours} onChange={e => updateField("openingHours", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Compliance ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Compliance
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">GSTIN</label>
                      <input placeholder="22AAACI1681A1ZA" className={`${inputCls} uppercase`} value={formData.gstin} onChange={e => updateField("gstin", e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">FSSAI Number</label>
                      <input placeholder="12345678901234" className={inputCls} value={formData.fssaiNumber} onChange={e => updateField("fssaiNumber", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Payments ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> Payments
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">UPI ID</label>
                      <input placeholder="cafe@upi" className={inputCls} value={formData.upiId} onChange={e => updateField("upiId", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">UPI Payee Name</label>
                      <input placeholder="Auto from cafe name" className={inputCls} value={formData.upiPayeeName} onChange={e => updateField("upiPayeeName", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION: Status (edit only or create) ─── */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Status
                  </div>
                  <div className="flex items-center gap-2">
                    {(["ACTIVE", "INACTIVE", "MAINTENANCE"] as CafeStatus[]).map((s) => {
                      const selected = formData.status === s;
                      const colors: Record<string, string> = {
                        ACTIVE: selected ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                        INACTIVE: selected ? "bg-rose-600 text-white border-rose-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                        MAINTENANCE: selected ? "bg-amber-600 text-white border-amber-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                      };
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField("status", s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${colors[s]}`}
                        >
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </form>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={closeFormModal} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  form=""
                  onClick={(e) => {
                    // Trigger form submit programmatically
                    const form = (e.target as HTMLElement).closest('.flex.flex-col')?.querySelector('form');
                    if (form) form.requestSubmit();
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-bold shadow-md transition-all active:scale-95"
                >
                  {editingCafe ? "Save Changes" : "Create Branch"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: Delete Branch Confirmation
         ══════════════════════════════════════════════════════════ */}
      {deletingCafe && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={(e) => { if (e.target === e.currentTarget) setDeletingCafe(null); }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delete Branch</h2>
                  <p className="text-xs text-slate-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-800/30 mb-5">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-rose-700 dark:text-rose-400">&quot;{deletingCafe.cafeName}&quot;</strong>?
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{deletingCafe.branchCode}</span>
                  <span>·</span>
                  <span>{deletingCafe.location.city}</span>
                  <span>·</span>
                  <span>Manager: {deletingCafe.managerName}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  All orders associated with this branch will remain in the system but the branch login will be permanently removed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingCafe(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md transition-all active:scale-95"
                >
                  Delete Branch
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
