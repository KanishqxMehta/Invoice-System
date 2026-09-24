"use client";

import React, { useState, useEffect } from "react";
import { MenuItem, ItemModifier, CartModifier, PortionVariant } from "@/lib/types";
import { formatINR } from "@/lib/calculator";
import { X, Plus, Check, Utensils } from "lucide-react";
import Portal from "./Portal";

interface Props {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    portion: PortionVariant | null,
    selectedModifiers: CartModifier[],
    notes: string,
    quantity: number
  ) => void;
}

export default function ModifierModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: Props) {
  const [selectedPortion, setSelectedPortion] = useState<PortionVariant | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<ItemModifier[]>([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Initialize portion if item has portions
  useEffect(() => {
    if (item && item.hasPortions && item.portions && item.portions.length > 0) {
      setSelectedPortion(item.portions[0]);
    } else {
      setSelectedPortion(null);
    }
    setSelectedModifiers([]);
    setNotes("");
    setQuantity(1);
  }, [item]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const toggleModifier = (mod: ItemModifier) => {
    if (selectedModifiers.some((m) => m.id === mod.id)) {
      setSelectedModifiers(selectedModifiers.filter((m) => m.id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const currentBasePrice = selectedPortion ? selectedPortion.price : item.price;
  const modifiersCost = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
  const unitPrice = currentBasePrice + modifiersCost;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    onAddToCart(
      item,
      selectedPortion,
      selectedModifiers.map((m) => ({ name: m.name, price: m.price })),
      notes.trim(),
      quantity
    );
    onClose();
  };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[86vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-sm flex items-center justify-center border border-emerald-600 text-emerald-600"
              title="100% Pure Vegetarian"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {item.hasPortions ? "Select Plate Portion & Add-ons" : `Base: ${formatINR(item.price)}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 min-h-0">
          {/* Portion Selection (Half Plate vs Full Plate) */}
          {item.hasPortions && item.portions && item.portions.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl space-y-2">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Select Portion Size</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {item.portions.map((por) => {
                  const isSelected = selectedPortion?.id === por.id;
                  return (
                    <button
                      key={por.id}
                      type="button"
                      onClick={() => setSelectedPortion(por)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-500"
                      }`}
                    >
                      <span className="font-bold text-xs">{por.name}</span>
                      <span className={`font-mono text-sm font-black mt-1 ${isSelected ? "text-white" : "text-amber-500"}`}>
                        {formatINR(por.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifiers List */}
          {item.availableModifiers && item.availableModifiers.length > 0 ? (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Customizations & Add-ons
              </label>
              <div className="space-y-2">
                {item.availableModifiers.map((mod) => {
                  const isChecked = selectedModifiers.some(
                    (m) => m.id === mod.id
                  );
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                        isChecked
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-medium">{mod.name}</span>
                      </div>
                      <span className="font-mono text-xs font-semibold">
                        {mod.price > 0 ? `+${formatINR(mod.price)}` : "Free"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            !item.hasPortions && (
              <p className="text-xs text-slate-500 italic">
                No additional add-ons configured for this item.
              </p>
            )
          )}

          {/* Special Preparation Note for Kitchen */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Kitchen Instructions / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Extra hot, Less spicy, Crisp crust..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 font-mono font-bold text-sm text-slate-900 dark:text-white min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border ${
                      quantity === q
                        ? "bg-amber-600 text-white border-amber-600"
                        : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    x{q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">
              {selectedPortion ? `${selectedPortion.name} Total` : "Total Item Amount"}
            </div>
            <div className="font-mono text-lg font-black text-amber-600 dark:text-amber-400">
              {formatINR(totalPrice)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
