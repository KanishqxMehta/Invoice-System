"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Order } from "@/lib/types";
import {
  getTables,
  saveTables,
  addSingleTable,
  removeSingleTable,
  setTableCount,
} from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import {
  X,
  Plus,
  Trash2,
  Utensils,
  Check,
  AlertCircle,
  Hash,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  runningOrders?: Order[];
  onTablesUpdated?: (tables: string[]) => void;
}

export default function TableManagerModal({
  isOpen,
  onClose,
  runningOrders = [],
  onTablesUpdated,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [customTableName, setCustomTableName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTables(getTables());
      setError(null);
      setCustomTableName("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const refreshTables = (newTables: string[]) => {
    setTables(newTables);
    if (onTablesUpdated) onTablesUpdated(newTables);
  };

  const handleSetCount = (count: number) => {
    if (count < 1) return;
    if (count > 60) {
      setError("Maximum 60 tables supported");
      return;
    }

    // Check if any occupied table would be removed
    const targetTables = Array.from({ length: count }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`);
    const occupiedTables = runningOrders.map((o) => o.tableNumber).filter(Boolean) as string[];
    const willRemoveOccupied = occupiedTables.some((tbl) => !targetTables.includes(tbl));

    if (willRemoveOccupied) {
      setError("Cannot decrease tables because an occupied table would be removed. Settle active tabs first.");
      return;
    }

    const updated = setTableCount(count);
    setError(null);
    refreshTables(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customTableName.trim();
    if (!name) return;

    if (tables.includes(name)) {
      setError(`Table "${name}" already exists`);
      return;
    }

    const updated = addSingleTable(name);
    setCustomTableName("");
    setError(null);
    refreshTables(updated);
  };

  const handleQuickAddNext = () => {
    const updated = addSingleTable();
    setError(null);
    refreshTables(updated);
  };

  const handleRemove = (tbl: string) => {
    const isOccupied = runningOrders.some((o) => o.tableNumber === tbl);
    if (isOccupied) {
      setError(`Table ${tbl} has an active running order! Settle or void the tab before removing.`);
      return;
    }

    if (tables.length <= 1) {
      setError("At least 1 table must remain in the cafe layout");
      return;
    }

    const updated = removeSingleTable(tbl);
    setError(null);
    refreshTables(updated);
  };

  const handleResetToTwelve = () => {
    const occupiedTables = runningOrders.map((o) => o.tableNumber).filter(Boolean) as string[];
    const defaultTwelve = Array.from({ length: 12 }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`);
    const willRemoveOccupied = occupiedTables.some((tbl) => !defaultTwelve.includes(tbl));

    if (willRemoveOccupied) {
      setError("Cannot reset: active occupied tables are outside T-01..T-12. Please settle them first.");
      return;
    }

    const updated = setTableCount(12);
    setError(null);
    refreshTables(updated);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-manager-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 id="table-manager-title" className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Dining Tables Setup</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  {tables.length} Total
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust table count, add custom sections (Patio, VIP), or remove free tables
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Stepper & Presets */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Quick Table Count
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scale your cafe seating up or down instantly
                </span>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSetCount(tables.length - 1)}
                  disabled={tables.length <= 1}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm disabled:opacity-40 transition-colors"
                  title="Remove 1 table"
                >
                  -
                </button>
                <span className="font-mono font-bold text-xs px-2 min-w-[32px] text-center text-amber-600 dark:text-amber-400">
                  {tables.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleSetCount(tables.length + 1)}
                  disabled={tables.length >= 60}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm disabled:opacity-40 transition-colors"
                  title="Add 1 table"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {[4, 6, 8, 10, 12, 16, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSetCount(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    tables.length === preset
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {preset} Tables
                </button>
              ))}

              <button
                type="button"
                onClick={handleResetToTwelve}
                className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                title="Reset to default 12 tables"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset 12</span>
              </button>
            </div>
          </div>

          {/* Add Custom Table Name */}
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Custom table name (e.g. VIP-1, Patio-A, T-15)"
                value={customTableName}
                onChange={(e) => {
                  setCustomTableName(e.target.value);
                  setError(null);
                }}
                className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!customTableName.trim()}
              className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom</span>
            </button>
            <button
              type="button"
              onClick={handleQuickAddNext}
              className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1 flex-shrink-0"
              title="Add next numbered table (e.g. T-13)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Next</span>
            </button>
          </form>

          {/* Current Tables List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Current Active Tables ({tables.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Click ✕ to remove any free table
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {tables.map((tbl) => {
                const running = runningOrders.find((o) => o.tableNumber === tbl);

                return (
                  <div
                    key={tbl}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                      running
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/70 text-emerald-900 dark:text-emerald-200"
                        : "bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          running ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      <span className="font-mono font-bold truncate">{tbl}</span>
                    </div>

                    {running ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                        {formatINR(running.finalTotal)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemove(tbl)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title={`Delete ${tbl}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Open Tabs Occupied: <strong className="text-emerald-600 dark:text-emerald-400">{runningOrders.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
