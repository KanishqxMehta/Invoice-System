"use client";

import React, { useState, useEffect, useRef } from "react";
import Portal from "./Portal";
import { Order, OrderType } from "@/lib/types";
import { formatINR } from "@/lib/calculator";
import {
  Utensils,
  ShoppingBag,
  Search,
  X,
  Check,
  Plus,
  Clock,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  ArrowLeftRight,
} from "lucide-react";

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
  runningOrders: Order[];
  onSelectRunningOrder: (order: Order | null) => void;
  orderType: OrderType;
  onSelectOrderType: (type: OrderType) => void;
  onOpenTableManager?: () => void;
  activeRunningOrder?: Order | null;
  onTransferTable?: (orderId: string, newTable: string) => void;
}

export default function TableSelectorModal({
  isOpen,
  onClose,
  tables,
  selectedTable,
  onSelectTable,
  runningOrders,
  onSelectRunningOrder,
  orderType,
  onSelectOrderType,
  onOpenTableManager,
  activeRunningOrder = null,
  onTransferTable,
}: TableSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "OCCUPIED" | "VACANT">("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setFilterMode("ALL");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Map running orders by table number for instant O(1) lookup
  const runningOrdersByTable = new Map<string, Order>();
  runningOrders.forEach((order) => {
    if (order.tableNumber) {
      runningOrdersByTable.set(order.tableNumber, order);
    }
  });

  // Calculate counts
  const occupiedCount = tables.filter((t) => runningOrdersByTable.has(t)).length;
  const vacantCount = tables.length - occupiedCount;

  // Filtered tables based on search and tab filter
  const filteredTables = tables.filter((tbl) => {
    const isOccupied = runningOrdersByTable.has(tbl);

    if (filterMode === "OCCUPIED" && !isOccupied) return false;
    if (filterMode === "VACANT" && isOccupied) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    const cleanTbl = tbl.toLowerCase();
    const numOnly = cleanTbl.replace(/[^0-9]/g, "");

    return (
      cleanTbl.includes(query) ||
      numOnly === query ||
      `table ${numOnly}`.includes(query) ||
      `t${numOnly}`.includes(query)
    );
  });

  const handleChooseTable = (tbl: string) => {
    onSelectOrderType("DINE_IN");

    const existingOrder = runningOrdersByTable.get(tbl);
    if (existingOrder) {
      onSelectTable(tbl);
      onSelectRunningOrder(existingOrder);
    } else {
      // It's a vacant table
      if (activeRunningOrder && onTransferTable && activeRunningOrder.tableNumber !== tbl) {
        onTransferTable(activeRunningOrder.id, tbl);
      } else {
        onSelectTable(tbl);
        onSelectRunningOrder(null);
      }
    }
    onClose();
  };

  const handleChooseTakeaway = () => {
    onSelectOrderType("TAKEAWAY");
    onSelectRunningOrder(null);
    onClose();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredTables.length > 0) {
      e.preventDefault();
      handleChooseTable(filteredTables[0]);
    }
  };

  const formatElapsed = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    } catch {
      return "";
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
          {/* HEADER */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  Select Dining Table
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {tables.length} Total
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tap any table to switch tabs or start a fresh order (Esc to exit)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenTableManager && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTableManager();
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Configure or scale tables"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Manage Tables</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type table # (e.g. 5, T-05) and press Enter..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode("ALL")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterMode === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All ({tables.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("OCCUPIED")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterMode === "OCCUPIED"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-700 dark:text-amber-400 hover:text-amber-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Occupied ({occupiedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("VACANT")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterMode === "VACANT"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Vacant ({vacantCount})</span>
              </button>
            </div>
          </div>

          {/* RUNNING ORDER SHIFTING BANNER */}
          {activeRunningOrder && (
            <div className="px-5 py-2.5 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300/60 dark:border-amber-700/60 flex items-center justify-between gap-3 flex-shrink-0 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 min-w-0">
                <ArrowLeftRight className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="truncate">
                  <strong>Moving Table {activeRunningOrder.tableNumber}</strong> (#{activeRunningOrder.orderNumber} • {formatINR(activeRunningOrder.finalTotal)}): Tap any available table below to transfer this order.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectRunningOrder(null);
                  onSelectOrderType("DINE_IN");
                }}
                className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex-shrink-0 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800"
              >
                Start Fresh Order Instead
              </button>
            </div>
          )}

          {/* QUICK TAKEAWAY / COUNTER OPTION BANNER */}
          <div className="px-5 py-2 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Ordering for takeout or direct counter pickup?</span>
            </div>
            <button
              type="button"
              onClick={handleChooseTakeaway}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                orderType === "TAKEAWAY"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 hover:bg-amber-100/70"
              }`}
            >
              <span>Switch to Takeaway</span>
              {orderType === "TAKEAWAY" && <Check className="w-3 h-3" />}
            </button>
          </div>

          {/* 2D TABLES GRID */}
          <div className="p-5 overflow-y-auto flex-1 min-h-[220px]">
            {filteredTables.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                <Utensils className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-semibold">No tables found matching &quot;{searchQuery}&quot;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs text-amber-600 dark:text-amber-400 underline font-semibold"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredTables.map((tbl) => {
                  const running = runningOrdersByTable.get(tbl);
                  const isCurrent = orderType === "DINE_IN" && selectedTable === tbl;

                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => handleChooseTable(tbl)}
                      className={`relative flex flex-col text-left p-3.5 rounded-2xl border transition-all text-xs group ${
                        running
                          ? isCurrent
                            ? "bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-md"
                            : "bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 border-amber-300/80 dark:border-amber-700/60 shadow-xs"
                          : isCurrent
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400/50 shadow-md"
                          : "bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors"
                      }`}
                    >
                      {/* Top Row: Table name + status pill */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {tbl}
                        </span>
                        {running ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Occupied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Free
                          </span>
                        )}
                      </div>

                      {/* Middle: Order details if occupied */}
                      {running ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono font-black text-sm text-amber-700 dark:text-amber-300">
                              {formatINR(running.finalTotal)}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              #{running.orderNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{running.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                            {running.createdAt && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatElapsed(running.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : activeRunningOrder && activeRunningOrder.tableNumber !== tbl ? (
                        <div className="py-2 text-[11px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3 text-amber-600" />
                          <span>Move Tab Here</span>
                        </div>
                      ) : (
                        <div className="py-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Available for seating
                        </div>
                      )}

                      {/* Active indicator badge */}
                      {isCurrent && (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs flex-shrink-0">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-semibold">T</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-semibold">F2</kbd> anywhere in POS to quickly open table menu
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
