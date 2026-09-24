"use client";

import React, { useState, useEffect } from "react";
import { KOTTicket, KOTStatus } from "@/lib/types";
import { getKOTTickets, updateKOTStatus, updateAllKOTStatus } from "@/lib/storage";
import KOTCard from "@/components/KOTCard";
import ThermalKOT58mm from "@/components/ThermalKOT58mm";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "@/lib/toast";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  History,
  X,
  Printer,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  Play,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import Portal from "@/components/Portal";

interface BulkMoveRequest {
  fromStatus: KOTStatus;
  toStatus: KOTStatus;
  fromLabel: string;
  toLabel: string;
  count: number;
  ticketNumbers: string[];
}

export default function KDSPage() {
  const [tickets, setTickets] = useState<KOTTicket[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [printingTicket, setPrintingTicket] = useState<KOTTicket | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Bulk Move Confirmation State
  const [bulkConfirm, setBulkConfirm] = useState<BulkMoveRequest | null>(null);

  // Column Dropdown Menu State
  const [activeMenuColumn, setActiveMenuColumn] = useState<KOTStatus | null>(null);

  // Batch Move Modal State (Header Bar)
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSource, setBatchSource] = useState<KOTStatus>("ACTIVE");
  const [batchTarget, setBatchTarget] = useState<KOTStatus>("PREPARING");

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll tickets from storage and listen to storage events
  useEffect(() => {
    const load = () => {
      setTickets(getKOTTickets());
    };
    load();
    window.addEventListener("storage", load);
    const interval = setInterval(load, 2000);
    return () => {
      window.removeEventListener("storage", load);
      clearInterval(interval);
    };
  }, []);

  // Escape key listener for modals & popovers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (bulkConfirm) setBulkConfirm(null);
        else if (showBatchModal) setShowBatchModal(false);
        else if (showCompleted) setShowCompleted(false);
        else if (activeMenuColumn) setActiveMenuColumn(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bulkConfirm, showBatchModal, showCompleted, activeMenuColumn]);

  const handleStatusChange = (ticketId: string, newStatus: KOTStatus) => {
    const updated = updateKOTStatus(ticketId, newStatus);
    setTickets(updated);
  };

  const handlePrint = (ticket: KOTTicket) => {
    setPrintingTicket(ticket);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getStatusLabel = (status: KOTStatus): string => {
    switch (status) {
      case "ACTIVE":
        return "Active Orders";
      case "PREPARING":
        return "In Preparation";
      case "READY":
        return "Ready for Pickup / Serve";
      case "COMPLETED":
        return "Completed / History";
      default:
        return status;
    }
  };

  const requestBulkMove = (fromStatus: KOTStatus, toStatus: KOTStatus) => {
    setActiveMenuColumn(null);
    if (fromStatus === toStatus) {
      toast.warning("Source and destination stages cannot be the same.");
      return;
    }
    const matchingTickets = tickets.filter((t) => t.status === fromStatus);
    if (matchingTickets.length === 0) {
      toast.info(`No tickets in "${getStatusLabel(fromStatus)}" to move.`);
      return;
    }

    setBulkConfirm({
      fromStatus,
      toStatus,
      fromLabel: getStatusLabel(fromStatus),
      toLabel: getStatusLabel(toStatus),
      count: matchingTickets.length,
      ticketNumbers: matchingTickets.map((t) => t.kotNumber),
    });
  };

  const handleConfirmBulkMove = () => {
    if (!bulkConfirm) return;
    const { fromStatus, toStatus, count, fromLabel, toLabel } = bulkConfirm;
    const updated = updateAllKOTStatus(fromStatus, toStatus);
    setTickets(updated);
    setBulkConfirm(null);
    setShowBatchModal(false);
    toast.success(`Successfully moved ${count} order${count > 1 ? "s" : ""} from ${fromLabel} to ${toLabel}!`);
  };

  // Group tickets into Kanban columns
  const activeTickets = tickets.filter((t) => t.status === "ACTIVE");
  const prepTickets = tickets.filter((t) => t.status === "PREPARING");
  const readyTickets = tickets.filter((t) => t.status === "READY");
  const completedTickets = tickets.filter((t) => t.status === "COMPLETED");

  const totalActiveItems = [...activeTickets, ...prepTickets].reduce(
    (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  return (
    <>
      {/* Printable KOT container strictly for browser print dialog */}
      {printingTicket && (
        <div id="printable-receipt" className="hidden print:block">
          <ThermalKOT58mm ticket={printingTicket} />
        </div>
      )}

      {/* Global Dropdown Dismiss Backdrop */}
      {activeMenuColumn && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setActiveMenuColumn(null)}
        />
      )}

      <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white select-none overflow-hidden min-h-[calc(100vh-3.5rem)]">
        {/* KDS Header Bar */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-inner">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kitchen Display System (KDS)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                  Live Ticket Kanban
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-updating elapsed timers • 58mm/80mm Thermal KOT Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Items Counter */}
            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Cooking Backlog:</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                {totalActiveItems} items
              </span>
            </div>

            {/* Live Clock */}
            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-mono text-sm text-slate-700 dark:text-slate-200">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{currentTime}</span>
            </div>

            {/* Batch Move All Utility */}
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
              title="Move all items from one stage to another"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Batch Move</span>
            </button>

            {/* Toggle Completed History */}
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showCompleted
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({completedTickets.length})</span>
            </button>
          </div>
        </div>

        {/* Batch Move Modal */}
        {showBatchModal && (
          <Portal>
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowBatchModal(false);
              }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
            >
              <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col text-slate-900 dark:text-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Batch Move Orders
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Advance or reorder all kitchen tickets at once
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-5 space-y-4">
                  {/* From State */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      From Stage (Source)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBatchSource("ACTIVE");
                          if (batchTarget === "ACTIVE") setBatchTarget("PREPARING");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          batchSource === "ACTIVE"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</div>
                        <div className="font-bold text-xs mt-0.5">Active</div>
                        <div className="text-[11px] font-mono mt-1 font-semibold text-blue-600 dark:text-blue-400">
                          {activeTickets.length} orders
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBatchSource("PREPARING");
                          if (batchTarget === "PREPARING") setBatchTarget("READY");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          batchSource === "PREPARING"
                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</div>
                        <div className="font-bold text-xs mt-0.5">In Prep</div>
                        <div className="text-[11px] font-mono mt-1 font-semibold text-amber-600 dark:text-amber-400">
                          {prepTickets.length} orders
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBatchSource("READY");
                          if (batchTarget === "READY") setBatchTarget("COMPLETED");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          batchSource === "READY"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</div>
                        <div className="font-bold text-xs mt-0.5">Ready</div>
                        <div className="text-[11px] font-mono mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          {readyTickets.length} orders
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Arrow divider */}
                  <div className="flex items-center justify-center py-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* To State */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      To Stage (Destination)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={batchSource === "ACTIVE"}
                        onClick={() => setBatchTarget("ACTIVE")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          batchTarget === "ACTIVE"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        } ${batchSource === "ACTIVE" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Active Orders</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={batchSource === "PREPARING"}
                        onClick={() => setBatchTarget("PREPARING")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          batchTarget === "PREPARING"
                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        } ${batchSource === "PREPARING" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>In Preparation</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={batchSource === "READY"}
                        onClick={() => setBatchTarget("READY")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          batchTarget === "READY"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        } ${batchSource === "READY" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Ready for Pickup</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBatchTarget("COMPLETED")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          batchTarget === "COMPLETED"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Completed / Served</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="text-amber-800 dark:text-amber-400 font-semibold">
                        Tickets to move:
                      </span>{" "}
                      <strong className="font-mono text-amber-950 dark:text-amber-200">
                        {batchSource === "ACTIVE"
                          ? activeTickets.length
                          : batchSource === "PREPARING"
                          ? prepTickets.length
                          : readyTickets.length}{" "}
                        orders
                      </strong>
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      Requires double verify
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      (batchSource === "ACTIVE" && activeTickets.length === 0) ||
                      (batchSource === "PREPARING" && prepTickets.length === 0) ||
                      (batchSource === "READY" && readyTickets.length === 0) ||
                      batchSource === batchTarget
                    }
                    onClick={() => requestBulkMove(batchSource, batchTarget)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span>Proceed to Confirm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Completed Tickets Modal */}
        {showCompleted && (
          <Portal>
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowCompleted(false);
              }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
            >
              <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col text-slate-900 dark:text-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Completed Kitchen Orders Today
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompleted(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {completedTickets.length === 0 ? (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm">
                      No completed tickets yet today.
                    </p>
                  ) : (
                    completedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                              {ticket.kotNumber}
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              #{ticket.orderNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                              {ticket.tableNumber || ticket.orderType}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {ticket.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrint(ticket)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Print 58mm KOT"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(ticket.id, "READY")}
                            className="text-xs text-amber-700 dark:text-amber-400 hover:underline px-2 py-1 font-semibold cursor-pointer"
                          >
                            Reopen
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Live Kanban Columns Grid */}
        <div className="flex-1 p-6 overflow-x-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Active Orders */}
          <div className="flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider truncate">
                  Active Orders
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  {activeTickets.length}
                </span>

                {activeTickets.length > 0 && (
                  <div className="relative">
                    <div className="inline-flex rounded-lg shadow-xs">
                      <button
                        type="button"
                        onClick={() => requestBulkMove("ACTIVE", "PREPARING")}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-l-lg transition-all active:scale-95 cursor-pointer"
                        title="Move all active orders to In Preparation"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start All</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenuColumn(activeMenuColumn === "ACTIVE" ? null : "ACTIVE")}
                        className="px-1.5 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white rounded-r-lg border-l border-amber-500/40 transition-colors cursor-pointer"
                        title="More options to move active orders"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {activeMenuColumn === "ACTIVE" && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs animate-in fade-in zoom-in-95">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                          Move all {activeTickets.length} orders to:
                        </div>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("ACTIVE", "PREPARING")}
                          className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>In Preparation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("ACTIVE", "READY")}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Ready for Pickup</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("ACTIVE", "COMPLETED")}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Complete & Archive</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeTickets.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[1.5] mb-2 opacity-40 text-blue-500" />
                  <p className="text-xs font-semibold">No new tickets</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-600">
                    New orders punched in POS will appear here instantly.
                  </p>
                </div>
              ) : (
                activeTickets.map((ticket) => (
                  <KOTCard
                    key={ticket.id}
                    ticket={ticket}
                    onUpdateStatus={handleStatusChange}
                    onPrintTicket={handlePrint}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Preparation */}
          <div className="flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider truncate">
                  In Preparation
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  {prepTickets.length}
                </span>

                {prepTickets.length > 0 && (
                  <div className="relative">
                    <div className="inline-flex rounded-lg shadow-xs">
                      <button
                        type="button"
                        onClick={() => requestBulkMove("PREPARING", "READY")}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-l-lg transition-all active:scale-95 cursor-pointer"
                        title="Mark all in-prep orders ready"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready All</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenuColumn(activeMenuColumn === "PREPARING" ? null : "PREPARING")}
                        className="px-1.5 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-r-lg border-l border-emerald-500/40 transition-colors cursor-pointer"
                        title="More options to move in-prep orders"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {activeMenuColumn === "PREPARING" && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs animate-in fade-in zoom-in-95">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                          Move all {prepTickets.length} orders to:
                        </div>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("PREPARING", "READY")}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Ready for Pickup</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("PREPARING", "COMPLETED")}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Complete & Archive</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("PREPARING", "ACTIVE")}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Move back to Active</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {prepTickets.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                  <Flame className="w-8 h-8 stroke-[1.5] mb-2 opacity-40 text-amber-500" />
                  <p className="text-xs font-semibold">Nothing brewing</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-600">
                    Click &quot;Start Preparing&quot; on an active order to move it here.
                  </p>
                </div>
              ) : (
                prepTickets.map((ticket) => (
                  <KOTCard
                    key={ticket.id}
                    ticket={ticket}
                    onUpdateStatus={handleStatusChange}
                    onPrintTicket={handlePrint}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Ready for Pickup */}
          <div className="flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider truncate">
                  Ready for Pickup / Serve
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  {readyTickets.length}
                </span>

                {readyTickets.length > 0 && (
                  <div className="relative">
                    <div className="inline-flex rounded-lg shadow-xs">
                      <button
                        type="button"
                        onClick={() => requestBulkMove("READY", "COMPLETED")}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-l-lg transition-all active:scale-95 cursor-pointer"
                        title="Mark all ready orders as served/completed"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Serve All</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenuColumn(activeMenuColumn === "READY" ? null : "READY")}
                        className="px-1.5 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded-r-lg border-l border-blue-500/40 transition-colors cursor-pointer"
                        title="More options to move ready orders"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {activeMenuColumn === "READY" && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs animate-in fade-in zoom-in-95">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                          Move all {readyTickets.length} orders to:
                        </div>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("READY", "COMPLETED")}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Complete & Archive</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("READY", "PREPARING")}
                          className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>Move back to In Prep</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestBulkMove("READY", "ACTIVE")}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Move back to Active</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {readyTickets.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[1.5] mb-2 opacity-40 text-emerald-500" />
                  <p className="text-xs font-semibold">No ready orders waiting</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-600">
                    Orders ready for customer pickup or table service.
                  </p>
                </div>
              ) : (
                readyTickets.map((ticket) => (
                  <KOTCard
                    key={ticket.id}
                    ticket={ticket}
                    onUpdateStatus={handleStatusChange}
                    onPrintTicket={handlePrint}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Double Verification Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(bulkConfirm)}
        onClose={() => setBulkConfirm(null)}
        onConfirm={handleConfirmBulkMove}
        title={`Move All ${bulkConfirm?.count || 0} Orders to ${bulkConfirm?.toLabel || ""}?`}
        description={`You are about to move ${bulkConfirm?.count || 0} kitchen ticket${(bulkConfirm?.count || 0) > 1 ? "s" : ""} (${bulkConfirm?.ticketNumbers?.slice(0, 6).join(", ")}${(bulkConfirm?.ticketNumbers?.length || 0) > 6 ? ` +${(bulkConfirm?.ticketNumbers?.length || 0) - 6} more` : ""}) from "${bulkConfirm?.fromLabel}" to "${bulkConfirm?.toLabel}". Please double verify to proceed.`}
        confirmText={`Yes, Move ${bulkConfirm?.count || 0} Order${(bulkConfirm?.count || 0) > 1 ? "s" : ""}`}
        cancelText="Cancel"
        variant={bulkConfirm?.toStatus === "COMPLETED" ? "info" : "warning"}
      />
    </>
  );
}
