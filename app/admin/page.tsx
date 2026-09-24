"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building,
  MapPin,
  Users,
  Phone,
  Mail,
  Plus,
  RefreshCw,
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  ChefHat,
  Monitor,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  QrCode,
  FileText,
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
  Lock,
  X,
  Store,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  getAllCafeAccounts,
  getOnlyCafeBranches,
  createCafeAccount,
  updateCafeAccount,
  deleteCafeAccount,
  CreateCafeAccountInput,
} from "@/lib/auth";
import {
  getAllOrdersRaw,
  getOrders,
  getAllKOTTicketsRaw,
  getKOTTickets,
  getSalesSummary,
  getRunningOrders,
  getTables,
} from "@/lib/storage";
import { CafeAccount, CafeLocation, CafeStatus } from "@/lib/types";
import { formatINR } from "@/lib/calculator";
import Portal from "@/components/Portal";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isSuperAdmin, switchCafe, refreshAuth } = useAuth();

  const [branches, setBranches] = useState<CafeAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCafe, setEditingCafe] = useState<CafeAccount | null>(null);
  const [deletingCafe, setDeletingCafe] = useState<CafeAccount | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Form state for creating a new cafe account
  const [formData, setFormData] = useState<CreateCafeAccountInput>({
    username: "",
    password: "",
    pin: "1234",
    cafeName: "",
    branchCode: "",
    tagline: "Heritage Flavours & Artisan Melts",
    location: {
      addressLine: "",
      landmark: "",
      city: "Delhi",
      state: "Delhi",
      pincode: "",
    },
    managerName: "",
    contactPhone: "+91 ",
    contactEmail: "",
    gstin: "",
    fssaiNumber: "",
    tableCount: 12,
    seatingCapacity: 48,
    upiId: "",
    upiPayeeName: "",
    status: "ACTIVE",
    openingHours: "09:00 AM - 11:00 PM",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Load and refresh multi-cafe metrics
  const loadData = () => {
    setIsRefreshing(true);
    try {
      const all = getOnlyCafeBranches();
      setBranches(all);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth-changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth-changed", handleStorage);
    };
  }, []);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Compute aggregate network metrics across all cafes
  const allOrders = getAllOrdersRaw();
  const allKots = getAllKOTTicketsRaw();
  const totalNetworkSales = allOrders
    .filter((o) => o.paymentStatus === "PAID" || !o.paymentStatus)
    .reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  const totalNetworkOrders = allOrders.length;
  const activeKotsCount = allKots.filter((k) => k.status !== "COMPLETED").length;
  const activeTablesCount = allOrders.filter(
    (o) => o.paymentStatus === "PENDING" && o.tableNumber
  ).length;

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.cafeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.addressLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.managerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate per-branch live stats
  const getBranchStats = (branchId: string) => {
    const branchOrders = allOrders.filter(
      (o) => (o.cafeId || "cafe-delhi-flagship") === branchId
    );
    const paidOrders = branchOrders.filter(
      (o) => o.paymentStatus === "PAID" || !o.paymentStatus
    );
    const todaySales = paidOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const branchKots = allKots.filter(
      (k) => (k.cafeId || "cafe-delhi-flagship") === branchId
    );
    const activeKots = branchKots.filter((k) => k.status !== "COMPLETED").length;
    const runningOrders = branchOrders.filter((o) => o.paymentStatus === "PENDING");
    const occupiedTables = runningOrders.filter((o) => o.tableNumber).length;

    return {
      todaySales,
      ordersCount: branchOrders.length,
      paidCount: paidOrders.length,
      activeKots,
      occupiedTables,
      runningCount: runningOrders.length,
    };
  };

  const handleLaunchStore = (branchId: string, route: "/pos" | "/kds" | "/invoices" = "/pos") => {
    switchCafe(branchId);
    router.push(route);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.cafeName.trim()) {
      setFormError("Cafe Name is required.");
      return;
    }
    if (!formData.branchCode.trim()) {
      setFormError("Branch Code is required.");
      return;
    }
    if (!formData.location.addressLine.trim() || !formData.location.city.trim()) {
      setFormError("Cafe location address and city are required.");
      return;
    }
    if (!formData.location.pincode.trim()) {
      setFormError("Pincode is required.");
      return;
    }
    if (!formData.username.trim() || !formData.password.trim()) {
      setFormError("Account username and password are required.");
      return;
    }
    if (!formData.managerName.trim()) {
      setFormError("Manager Name is required.");
      return;
    }
    if (!formData.contactPhone.trim() || formData.contactPhone.length < 10) {
      setFormError("Valid contact phone number is required.");
      return;
    }

    try {
      const created = createCafeAccount({
        ...formData,
        upiPayeeName: formData.upiPayeeName || formData.cafeName,
        upiId: formData.upiId || `${formData.username.toLowerCase()}@okhdfcbank`,
      });
      loadData();
      refreshAuth();
      setIsCreateModalOpen(false);
      showSuccess(`Branch account for "${created.cafeName}" created successfully!`);
      // Reset form
      setFormData({
        username: "",
        password: "",
        pin: "1234",
        cafeName: "",
        branchCode: "",
        tagline: "Heritage Flavours & Artisan Melts",
        location: {
          addressLine: "",
          landmark: "",
          city: "Delhi",
          state: "Delhi",
          pincode: "",
        },
        managerName: "",
        contactPhone: "+91 ",
        contactEmail: "",
        gstin: "",
        fssaiNumber: "",
        tableCount: 12,
        seatingCapacity: 48,
        upiId: "",
        upiPayeeName: "",
        status: "ACTIVE",
        openingHours: "09:00 AM - 11:00 PM",
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to create cafe account.");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCafe) return;

    try {
      updateCafeAccount(editingCafe.id, editingCafe);
      loadData();
      refreshAuth();
      setEditingCafe(null);
      showSuccess(`Details for "${editingCafe.cafeName}" updated.`);
    } catch (err: any) {
      alert(err.message || "Failed to update cafe.");
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingCafe) return;
    try {
      deleteCafeAccount(deletingCafe.id);
      loadData();
      refreshAuth();
      showSuccess(`Branch "${deletingCafe.cafeName}" deleted.`);
      setDeletingCafe(null);
    } catch (err: any) {
      alert(err.message || "Could not delete cafe.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-0 overflow-y-auto">
      {/* Top Banner & Control Deck */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              <Shield className="w-4 h-4" />
              <span>Headquarters Central Command</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                Live Sync
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Multi-Cafe Network Monitoring &amp; Accounts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor live performance of all cafe locations, launch POS terminals, and register new branches with full address &amp; operational details.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Cafe Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Bar */}
      {actionSuccessMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Ribbons: Network Total Performance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Gross Sales Today</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {formatINR(totalNetworkSales)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              All {branches.length} branches combined
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Total Orders</span>
              <Receipt className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {totalNetworkOrders}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dine-In, Takeaway &amp; Zomato
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Active Tables</span>
              <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {activeTablesCount}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Currently seated guests
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Kitchen Backlog</span>
              <ChefHat className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {activeKotsCount}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
              KOT tickets in prep
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Active Branches</span>
              <Building className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {branches.filter((b) => b.status === "ACTIVE").length} / {branches.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Locations online
            </div>
          </div>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search branches by name, city, code, manager, or street..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["ALL", "ACTIVE", "MAINTENANCE", "INACTIVE"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedStatusFilter === status
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {status === "ALL" ? "All Status" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Branch Monitoring Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => {
            const stats = getBranchStats(branch.id);
            const tableProgress =
              branch.tableCount > 0
                ? Math.min(100, Math.round((stats.occupiedTables / branch.tableCount) * 100))
                : 0;

            return (
              <div
                key={branch.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Cafe Name, Code & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {branch.branchCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            branch.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : branch.status === "MAINTENANCE"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              branch.status === "ACTIVE"
                                ? "bg-emerald-500 animate-pulse"
                                : branch.status === "MAINTENANCE"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {branch.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5 truncate" title={branch.cafeName}>
                        {branch.cafeName}
                      </h3>
                      {branch.tagline && (
                        <p className="text-[11px] text-slate-400 italic truncate">{branch.tagline}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCafe(branch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Branch & Location"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCafe(branch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Branch Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Location Information (User Explicit Requirement) */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {branch.location.addressLine}
                        </div>
                        {branch.location.landmark && (
                          <div className="text-[11px] text-slate-400">
                            Landmark: {branch.location.landmark}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {branch.location.city}, {branch.location.state} • {branch.location.pincode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manager, Phone & Credentials */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate" title={branch.managerName}>
                        {branch.managerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] truncate">{branch.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-[10px] truncate" title={`GSTIN: ${branch.gstin}`}>
                        GST: {branch.gstin || "Unregistered"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Key className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        Login: <strong className="text-slate-900 dark:text-white">{branch.username}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Live Monitoring Metrics for this Cafe */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Today's Sales</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {formatINR(stats.todaySales)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Orders</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {stats.ordersCount}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">In Kitchen</div>
                      <div className={`text-sm font-bold font-mono mt-0.5 ${stats.activeKots > 0 ? "text-rose-500" : "text-slate-500"}`}>
                        {stats.activeKots} KOT
                      </div>
                    </div>
                  </div>

                  {/* Table Occupancy Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Table Seating ({stats.occupiedTables}/{branch.tableCount} Occupied)</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{tableProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tableProgress > 80
                            ? "bg-rose-500"
                            : tableProgress > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${tableProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Action Hub */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchStore(branch.id, "/pos")}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    title="Launch POS Cashier Terminal for this Cafe"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Launch POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchStore(branch.id, "/kds")}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Open Kitchen Display (KDS) for this Cafe"
                  >
                    <ChefHat className="w-4 h-4 text-rose-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchStore(branch.id, "/invoices")}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="View Invoices & Receipts for this Cafe"
                  >
                    <Receipt className="w-4 h-4 text-indigo-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchCafe(branch.id);
                      showSuccess(`Active session switched to ${branch.cafeName}`);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Switch Global Active Cafe to this Branch"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBranches.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Building className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No cafe branches found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No branch accounts matched your query. Click "+ Create New Cafe Account" to add a new location.
            </p>
          </div>
        )}

        {/* Multi-Branch Live Order Activity Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Multi-Store Order Stream
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Recent orders across all branches
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {allOrders.slice(0, 6).map((order) => {
              const branch = branches.find((b) => b.id === order.cafeId);
              return (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {order.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[160px]">
                      {branch ? branch.cafeName : "Flagship Old Delhi"}
                    </span>
                    <span className="text-slate-500 truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono flex-shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(order.finalTotal)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {order.paymentStatus || "PAID"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- CREATE CAFE ACCOUNT MODAL ---------------- */}
      {isCreateModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-500" />
                    <span>Register New Cafe Branch Account</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Specify the branch location, manager incharge, and cashier credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Cafe Identity */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    1. Cafe Identity &amp; Branding
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Cafe / Branch Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cafeName}
                        onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                        placeholder="e.g. Chandni Chowk Cheese Cafe - Koramangala"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Branch Code (Short Code) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.branchCode}
                        onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. CC-BLR-04"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Detailed Location (User Requirement!) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    2. Cafe Physical Location (Street &amp; Address)
                  </h4>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Address / Street Line *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location.addressLine}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: { ...formData.location, addressLine: e.target.value },
                          })
                        }
                        placeholder="e.g. Plot 14, 12th Main, 100ft Road"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={formData.location.landmark || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: { ...formData.location, landmark: e.target.value },
                            })
                          }
                          placeholder="e.g. Near Metro Station"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.location.city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: { ...formData.location, city: e.target.value },
                            })
                          }
                          placeholder="e.g. Bengaluru"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.location.pincode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: { ...formData.location, pincode: e.target.value.replace(/\D/g, "") },
                            })
                          }
                          placeholder="e.g. 560038"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Account Login Credentials */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    3. Account Credentials &amp; Cashier Access
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                        placeholder="e.g. chandni_koramangala"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="e.g. cafe123"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Cashier PIN (4 Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="e.g. 5566"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Manager & Business Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    4. Management &amp; Regulatory Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Branch Manager Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.managerName}
                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        placeholder="e.g. Karthik Subramanian"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+91 98450 12345"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        placeholder="e.g. 29AABCC1234F1Z5"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Dining Tables Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={formData.tableCount || 12}
                        onChange={(e) => setFormData({ ...formData, tableCount: parseInt(e.target.value) || 12 })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                  >
                    Create Branch Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ---------------- EDIT CAFE ACCOUNT MODAL ---------------- */}
      {editingCafe && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-500" />
                    <span>Edit Cafe: {editingCafe.cafeName}</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCafe(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Cafe Name</label>
                  <input
                    type="text"
                    required
                    value={editingCafe.cafeName}
                    onChange={(e) => setEditingCafe({ ...editingCafe, cafeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Street Address</label>
                    <input
                      type="text"
                      required
                      value={editingCafe.location.addressLine}
                      onChange={(e) =>
                        setEditingCafe({
                          ...editingCafe,
                          location: { ...editingCafe.location, addressLine: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">City</label>
                    <input
                      type="text"
                      required
                      value={editingCafe.location.city}
                      onChange={(e) =>
                        setEditingCafe({
                          ...editingCafe,
                          location: { ...editingCafe.location, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Manager Name</label>
                    <input
                      type="text"
                      required
                      value={editingCafe.managerName}
                      onChange={(e) => setEditingCafe({ ...editingCafe, managerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                    <input
                      type="text"
                      required
                      value={editingCafe.contactPhone}
                      onChange={(e) => setEditingCafe({ ...editingCafe, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={editingCafe.status}
                      onChange={(e) => setEditingCafe({ ...editingCafe, status: e.target.value as CafeStatus })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Table Count</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={editingCafe.tableCount}
                      onChange={(e) => setEditingCafe({ ...editingCafe, tableCount: parseInt(e.target.value) || 12 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCafe(null)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ---------------- DELETE CONFIRMATION MODAL ---------------- */}
      {deletingCafe && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-500/10 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Cafe Account?</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong>{deletingCafe.cafeName}</strong> ({deletingCafe.branchCode})? This will remove its branch login credentials.
              </p>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCafe(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Yes, Delete Account
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
