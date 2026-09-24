"use client";

import React, { useState, useEffect } from "react";
import { KOTTicket, KOTStatus } from "@/lib/types";
import {
  Clock,
  Printer,
  ChevronRight,
  CheckCheck,
  AlertTriangle,
  Flame,
  Utensils,
  ShoppingBag,
} from "lucide-react";

interface Props {
  ticket: KOTTicket;
  onUpdateStatus: (ticketId: string, newStatus: KOTStatus) => void;
  onPrintTicket: (ticket: KOTTicket) => void;
}

export default function KOTCard({
  ticket,
  onUpdateStatus,
  onPrintTicket,
}: Props) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const start = new Date(ticket.createdAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;
  const formattedTimer = `${elapsedMinutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;

  // Color alerts based on elapsed time:
  // < 10 mins: green / calm
  // 10-15 mins: yellow alert
  // 15+ mins: urgent red pulse
  const isYellowAlert = elapsedMinutes >= 10 && elapsedMinutes < 15;
  const isRedAlert = elapsedMinutes >= 15;

  let timerBadgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  if (isRedAlert && ticket.status !== "COMPLETED") {
    timerBadgeColor = "bg-rose-50 dark:bg-red-950/80 text-rose-700 dark:text-red-400 border-rose-300 dark:border-red-600 animate-pulse font-bold";
  } else if (isYellowAlert && ticket.status !== "COMPLETED") {
    timerBadgeColor = "bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500 font-bold";
  }

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between overflow-hidden shadow-xs select-none ${
        isRedAlert && ticket.status !== "COMPLETED"
          ? "border-red-500 ring-2 ring-red-500/20 ticket-urgent"
          : isYellowAlert && ticket.status !== "COMPLETED"
          ? "border-amber-500/80"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Ticket Header */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950">
            {ticket.kotNumber}
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>#{ticket.orderNumber}</span>
              {ticket.tableNumber ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-mono font-bold">
                  {ticket.tableNumber}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-semibold">
                  {ticket.orderType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Elapsed Timer */}
        <div
          className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg border ${timerBadgeColor}`}
          title="Elapsed preparation time"
        >
          {isRedAlert ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 animate-spin" />
          ) : isYellowAlert ? (
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
          )}
          <span>{formattedTimer}</span>
        </div>
      </div>

      {/* Items Body */}
      <div className="p-3.5 space-y-2.5 flex-1">
        {ticket.items.map((item, idx) => (
          <div
            key={idx}
            className="pb-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    item.isVeg ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {item.name}
                </span>
                {item.portionName && !item.name.includes(item.portionName) && (
                  <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-1.5 py-0.5 rounded ml-1.5">
                    {item.portionName}
                  </span>
                )}
              </div>
              <span className="font-mono text-base font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700">
                x{item.quantity}
              </span>
            </div>

            {/* Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 pl-3.5">
                {item.modifiers.map((m, mIdx) => (
                  <span
                    key={mIdx}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono border border-slate-200 dark:border-slate-700"
                  >
                    +{m.name}
                  </span>
                ))}
              </div>
            )}

            {/* Preparation Notes Badge */}
            {item.notes && (
              <div className="mt-1 pl-3.5">
                <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md inline-block uppercase">
                  ⚡ {item.notes}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Global Preparation notes */}
        {ticket.preparationNotes && (
          <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
            <span className="font-bold uppercase tracking-wide text-[10px] block text-amber-700 dark:text-amber-400">
              Kitchen Instructions:
            </span>
            <span>{ticket.preparationNotes}</span>
          </div>
        )}
      </div>

      {/* Ticket Footer & Status Controls */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onPrintTicket(ticket)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Thermal Print 58mm KOT Ticket"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Status Transition Button */}
        {ticket.status === "ACTIVE" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(ticket.id, "PREPARING")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 transition-all"
          >
            <span>Start Preparing</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {ticket.status === "PREPARING" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(ticket.id, "READY")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
          >
            <span>Mark Ready</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {ticket.status === "READY" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(ticket.id, "COMPLETED")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Serve / Complete</span>
          </button>
        )}

        {ticket.status === "COMPLETED" && (
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
            ✓ Completed
          </span>
        )}
      </div>
    </div>
  );
}
