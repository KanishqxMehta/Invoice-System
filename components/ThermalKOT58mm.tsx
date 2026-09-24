import React from "react";
import { KOTTicket } from "@/lib/types";

interface Props {
  ticket: KOTTicket;
}

export default function ThermalKOT58mm({ ticket }: Props) {
  const formattedDate = new Date(ticket.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="thermal-58mm bg-white text-black leading-tight select-none">
      {/* KOT Header */}
      <div className="text-center">
        <h2 className="font-extrabold text-sm uppercase tracking-wider">
          *** KITCHEN ORDER TOKEN ***
        </h2>
        <div className="font-mono text-lg font-black my-1 border-2 border-black py-0.5 inline-block px-3">
          {ticket.kotNumber}
        </div>
      </div>

      <div className="print-cut-line my-1 border-t border-dashed border-black"></div>

      {/* Meta Info */}
      <div className="text-[11px] space-y-0.5 font-mono">
        <div className="flex justify-between font-bold">
          <span>Order: #{ticket.orderNumber}</span>
          <span>{ticket.orderType}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {formattedDate}</span>
          <span>Time: {formattedTime}</span>
        </div>
        {ticket.tableNumber && (
          <div className="font-extrabold text-xs">
            TABLE: {ticket.tableNumber}
          </div>
        )}
      </div>

      <div className="print-cut-line my-1 border-t border-dashed border-black"></div>

      {/* Items Table - NO PRICES, NO TAXES */}
      <div className="font-mono">
        <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-black">
          <span className="w-9/12 text-left">ITEM</span>
          <span className="w-3/12 text-right">QTY</span>
        </div>

        <div className="py-1 space-y-1.5 text-[11px]">
          {ticket.items.map((item, idx) => (
            <div key={idx} className="border-b border-dotted border-gray-400 pb-1">
              <div className="flex justify-between items-start font-bold">
                <span className="w-9/12 text-left text-xs leading-snug">
                  {item.name}
                  {item.portionName && !item.name.includes(item.portionName) && (
                    <span className="block text-[10px] font-extrabold uppercase text-black">
                      [{item.portionName}]
                    </span>
                  )}
                </span>
                <span className="w-3/12 text-right text-sm font-black">
                  x{item.quantity}
                </span>
              </div>

              {/* Modifiers / Customizations */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="pl-2 mt-0.5 text-[10px] font-semibold text-gray-800">
                  {item.modifiers.map((m, mIdx) => (
                    <div key={mIdx}>+ {m.name}</div>
                  ))}
                </div>
              )}

              {/* Kitchen Note */}
              {item.notes && (
                <div className="pl-2 mt-0.5 text-[10px] font-bold text-black uppercase bg-gray-200 px-1 inline-block">
                  NOTE: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overall Prep notes */}
      {ticket.preparationNotes && (
        <div className="mt-1 p-1 border border-black text-[10px] font-mono">
          <div className="font-bold uppercase">Special Instructions:</div>
          <div>{ticket.preparationNotes}</div>
        </div>
      )}

      <div className="print-cut-line my-2 border-t border-dashed border-black"></div>
      <div className="text-center font-mono text-[9px] text-gray-600">
        --------------------------------
      </div>
    </div>
  );
}
