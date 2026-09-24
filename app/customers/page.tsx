"use client";

import React, { useState, useEffect } from "react";
import { Customer, PointsLedgerEntry } from "@/lib/types";
import { getCustomers, getPointsLedger } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import QuickAddCustomerModal from "@/components/QuickAddCustomerModal";
import {
  Users,
  Search,
  UserPlus,
  Sparkles,
  Gift,
  History,
  X,
  Phone,
  Mail,
  Receipt,
  Calendar,
} from "lucide-react";
import Portal from "@/components/Portal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Selected customer for Ledger Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<PointsLedgerEntry[]>([]);

  useEffect(() => {
    setCustomers(getCustomers());
    const handleStorage = () => setCustomers(getCustomers());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCustomer(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCustomer]);

  const handleOpenLedger = (cust: Customer) => {
    setSelectedCustomer(cust);
    const entries = getPointsLedger(cust.id);
    setLedgerEntries(entries);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.replace(/[\s-]/g, "").includes(q.replace(/[\s-]/g, "")) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 space-y-6 min-h-[calc(100vh-3.5rem)]">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span>Customer Loyalty Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage customer rewards, track visit frequency, and view points audit ledgers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Total Registered: </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">{customers.length}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Total Points Issued: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {customers.reduce((s, c) => s + c.pointsBalance, 0)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Total Spent</th>
                <th className="px-5 py-3.5">Visits</th>
                <th className="px-5 py-3.5">Points Balance</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No customers found matching &quot;{search}&quot;.</p>
                      {search.trim() && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Quick Add &quot;{search}&quot;</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center font-bold text-xs">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{cust.name}</div>
                          {cust.email && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{cust.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300 text-xs">
                      {cust.phone}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-slate-200">
                      {formatINR(cust.totalSpent)}
                    </td>

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {cust.visitCount} visits
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-mono font-black text-amber-700 dark:text-amber-400">
                          {cust.pointsBalance}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          (₹{cust.pointsBalance} value)
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenLedger(cust)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Points Ledger</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Points Ledger Modal */}
      {selectedCustomer && (
        <Portal>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCustomer(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
          >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-900 dark:text-white">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedCustomer.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 font-mono">
                      {selectedCustomer.pointsBalance} pts
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 min-h-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Points Audit Trail
              </div>

              {ledgerEntries.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 py-8 text-xs">
                  No historical ledger movements recorded for this customer.
                </div>
              ) : (
                ledgerEntries.map((entry) => {
                  const isEarned = entry.pointsChange > 0;
                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {entry.reason}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {new Date(entry.createdAt).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold text-sm ${
                            isEarned
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {isEarned ? `+${entry.pointsChange}` : entry.pointsChange}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Bal: {entry.balanceAfter} pts
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Fixed Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Quick Add Modal */}
      <QuickAddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialPhone={/\d{4,}/.test(search) ? search.trim() : ""}
        onCustomerAdded={(cust) => {
          setCustomers(getCustomers());
        }}
      />
    </div>
  );
}
