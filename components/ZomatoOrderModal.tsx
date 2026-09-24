"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Bike,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  ChefHat,
  Receipt,
  ExternalLink,
  Layers,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  MenuItem,
  OrderItemSnapshot,
  Order,
  OrderType,
  PaymentMethod,
} from "@/lib/types";
import {
  getMenuItems,
  getOrders,
  createOrderAndKOT,
  deleteOrder,
  getSettings,
} from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import Link from "next/link";
import { createPortal } from "react-dom";
import ConfirmModal from "./ConfirmModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ZomatoDraftItem {
  id: string;
  name: string;
  portionName?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isVeg: boolean;
  notes?: string;
}

export default function ZomatoOrderModal({ isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"NEW" | "LOG">("NEW");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [zomatoOrders, setZomatoOrders] = useState<Order[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; orderNumber: string; zId?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Form State
  const [zomatoOrderId, setZomatoOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [sendToKDS, setSendToKDS] = useState(true);
  const [packagingCharge, setPackagingCharge] = useState<string>("0");
  const [draftItems, setDraftItems] = useState<ZomatoDraftItem[]>([]);

  // Item catalog selector state
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Custom Item quick-add modal/inputs
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");

  // Feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setMenuItems(
      getMenuItems().filter((i) => i.isAvailable && i.availableOnZomato !== false)
    );
    const allOrders = getOrders();
    const zomatoList = allOrders.filter(
      (o) =>
        o.isZomatoOrder ??
        (o.orderType === "DELIVERY" || o.paymentMethod === "ZOMATO" || !!o.zomatoOrderId)
    );
    setZomatoOrders(zomatoList);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    menuItems.forEach((i) => set.add(i.category));
    return Array.from(set);
  }, [menuItems]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, catalogSearch]);

  // Financial calculations
  const itemsSubtotal = useMemo(() => {
    return draftItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [draftItems]);

  const packagingFee = Math.max(0, parseFloat(packagingCharge) || 0);
  const taxableAmount = itemsSubtotal + packagingFee;
  const gstRate = 0.05; // 5% total (2.5% CGST + 2.5% SGST)
  const cgst = Number(((taxableAmount * 0.025)).toFixed(2));
  const sgst = Number(((taxableAmount * 0.025)).toFixed(2));
  const taxAmount = Number((cgst + sgst).toFixed(2));
  const rawFinalTotal = taxableAmount + taxAmount;
  const finalTotal = Math.round(rawFinalTotal);

  // Stats
  const totalZomatoEarnings = useMemo(() => {
    return zomatoOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  }, [zomatoOrders]);

  const todayZomatoEarnings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return zomatoOrders
      .filter((o) => o.createdAt.startsWith(today))
      .reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  }, [zomatoOrders]);

  // Handlers
  const handleAddItem = (menuItem: MenuItem, portionName?: string, price?: number) => {
    const effectivePrice = price !== undefined ? price : (menuItem.zomatoPrice ?? menuItem.price);
    const lineId = portionName ? `${menuItem.id}-${portionName}` : menuItem.id;

    setDraftItems((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (existing) {
        return prev.map((item) =>
          item.id === lineId
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: lineId,
          name: menuItem.name,
          portionName,
          unitPrice: effectivePrice,
          quantity: 1,
          subtotal: effectivePrice,
          isVeg: menuItem.isVeg,
        },
      ];
    });
  };

  const handleAddCustomItem = () => {
    const name = customItemName.trim();
    const price = parseFloat(customItemPrice);
    if (!name || isNaN(price) || price <= 0) return;

    const lineId = `custom-${Date.now()}`;
    setDraftItems((prev) => [
      ...prev,
      {
        id: lineId,
        name,
        unitPrice: price,
        quantity: 1,
        subtotal: price,
        isVeg: true,
      },
    ]);

    setCustomItemName("");
    setCustomItemPrice("");
    setShowCustomItem(false);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setDraftItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return {
              ...item,
              quantity: nextQty,
              subtotal: nextQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveZomatoOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!zomatoOrderId.trim()) {
      setToastMessage("Please enter the Zomato Order # (e.g. ZOM-4921)");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (draftItems.length === 0) {
      setToastMessage("Please add at least one item to the Zomato order.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const cleanZomatoId = zomatoOrderId.trim();
    const formattedZomatoId = cleanZomatoId.toUpperCase().startsWith("ZOM-")
      ? cleanZomatoId.toUpperCase()
      : `ZOM-${cleanZomatoId}`;

    const snapshots: OrderItemSnapshot[] = draftItems.map((item) => ({
      id: item.id,
      name: item.portionName ? `${item.name} (${item.portionName})` : item.name,
      portionName: item.portionName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      modifiers: [],
      notes: item.notes,
      subtotal: item.subtotal,
      isVeg: item.isVeg,
    }));

    if (packagingFee > 0) {
      snapshots.push({
        id: `pkg-${Date.now()}`,
        name: "Eco Packaging & Cutlery Box",
        quantity: 1,
        unitPrice: packagingFee,
        modifiers: [],
        subtotal: packagingFee,
        isVeg: true,
      });
    }

    const combinedNotes = [
      `Zomato Order #${formattedZomatoId}`,
      customerName ? `Rider/Customer: ${customerName.trim()}` : null,
      prepNotes.trim() ? prepNotes.trim() : null,
    ]
      .filter(Boolean)
      .join(" • ");

    // Record order in storage
    const result = createOrderAndKOT({
      customerName: customerName.trim() || "Zomato Customer",
      customerPhone: customerPhone.trim() || undefined,
      subtotal: taxableAmount,
      cgst,
      sgst,
      taxAmount,
      discountAmount: 0,
      pointsRedeemed: 0,
      pointsDiscount: 0,
      finalTotal,
      pointsEarned: 0,
      paymentMethod: "ZOMATO",
      paymentStatus: "PAID",
      orderType: "DELIVERY",
      isZomatoOrder: true,
      zomatoOrderId: formattedZomatoId,
      notes: combinedNotes,
      items: snapshots,
    });

    // Broadcast update across tabs
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    // Reset Form
    setZomatoOrderId("");
    setCustomerName("");
    setCustomerPhone("");
    setPrepNotes("");
    setPackagingCharge("0");
    setDraftItems([]);

    setToastMessage(`✅ Zomato Order ${formattedZomatoId} recorded! Total: ${formatINR(finalTotal)}`);
    setTimeout(() => setToastMessage(null), 4000);

    loadData();
    setActiveTab("LOG");
  };

  const handleDeleteOrder = (id: string, orderNumber: string, zId?: string) => {
    setDeleteTarget({ id, orderNumber, zId });
  };

  const confirmDeleteOrder = () => {
    if (!deleteTarget) return;
    deleteOrder(deleteTarget.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    loadData();
    setDeleteTarget(null);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] max-h-[820px] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 dark:bg-red-500/25 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-red-500/20">
              <Bike className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Zomato Orders &amp; Reference Desk
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800/80">
                  Online Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Log online delivery items for billing reference &amp; sales reports. All payments settled via Zomato.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Stats Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-slate-500 dark:text-slate-400">Today:</span>
              <strong className="text-red-600 dark:text-red-400 font-mono">
                {formatINR(todayZomatoEarnings)}
              </strong>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-500 dark:text-slate-400">Total:</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {formatINR(totalZomatoEarnings)}
              </strong>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex-shrink-0 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("NEW")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "NEW"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Zomato Items</span>
              {draftItems.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
                  {draftItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("LOG")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "LOG"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Logged Zomato Orders</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {zomatoOrders.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Payments auto-marked as Paid via Zomato</span>
          </div>
        </div>

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="px-5 py-2 bg-red-600 text-white text-xs font-semibold flex items-center justify-between flex-shrink-0 animate-in fade-in">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: New Zomato Order */}
        {activeTab === "NEW" && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Column: Menu Catalog Picker (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col min-h-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              {/* Catalog Search & Category Filters */}
              <div className="p-3.5 space-y-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search menu items to add (e.g. Latte, Momos)..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCustomItem((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-xl border border-dashed border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Custom Item</span>
                  </button>
                </div>

                {/* Custom Item Form */}
                {showCustomItem && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 flex items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Item name (e.g. Special Combo)"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <div className="relative w-24">
                      <span className="text-xs text-slate-400 absolute left-2 top-1">₹</span>
                      <input
                        type="number"
                        placeholder="Price"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        className="w-full pl-5 pr-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredMenuItems.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-slate-400">
                    No matching items found. Use &quot;Custom Item&quot; to enter manually.
                  </div>
                ) : (
                  filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-red-300 dark:hover:border-red-800 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      {/* Portions or Single Price Add */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {item.hasPortions && item.portions && item.portions.length > 0 ? (
                          <div className="flex items-center gap-1 w-full">
                            {item.portions.map((p) => {
                              const zomatoPortionPrice = p.zomatoPrice ?? p.price;
                              const hasCustomRate = p.zomatoPrice !== undefined && p.zomatoPrice !== p.price;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleAddItem(item, p.name, zomatoPortionPrice)}
                                  className="flex-1 py-1 px-1.5 rounded-lg bg-red-50/50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 hover:border-red-400 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:text-red-600 transition-colors flex items-center justify-between"
                                  title={hasCustomRate ? `Zomato Rate: ₹${zomatoPortionPrice} (Cafe: ₹${p.price})` : `Zomato Rate: ₹${zomatoPortionPrice}`}
                                >
                                  <span className="truncate">{p.name}</span>
                                  <div className="text-right ml-1 flex-shrink-0">
                                    <span className="font-mono text-[10px] text-red-600 dark:text-red-400 font-bold">
                                      {formatINR(zomatoPortionPrice)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                {formatINR(item.zomatoPrice ?? item.price)}
                              </span>
                              {item.zomatoPrice && item.zomatoPrice !== item.price && (
                                <span className="text-[10px] text-slate-400 line-through font-mono">
                                  {formatINR(item.price)}
                                </span>
                              )}
                              <span className="text-[9px] uppercase font-bold text-red-600/80 bg-red-50 dark:bg-red-950/60 px-1 py-0.2 rounded border border-red-200 dark:border-red-900">
                                Zomato
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddItem(item, undefined, item.zomatoPrice ?? item.price)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Order Reference Details & Bill Breakdown (5 cols on lg) */}
            <form
              onSubmit={handleSaveZomatoOrder}
              className="lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900"
            >
              {/* Order Metadata Input Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3 flex-shrink-0">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                    <span>Zomato Order # / Reference</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-normal">
                      Required for tracking
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. ZOM-8839 or 8839"
                      value={zomatoOrderId}
                      onChange={(e) => setZomatoOrderId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800/80 text-red-600 dark:text-red-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                      Rider / Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rider Mukesh"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                      Customer Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 99000 00000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                    Kitchen Prep / Rider Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Extra spicy, pack separately"
                    value={prepNotes}
                    onChange={(e) => setPrepNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Added Draft Items List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  <span>Selected Zomato Items ({draftItems.length})</span>
                  {draftItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftItems([])}
                      className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {draftItems.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 space-y-1">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
                    <p className="font-semibold">No items added yet</p>
                    <p className="text-[11px]">Click items from the left menu to add them here</p>
                  </div>
                ) : (
                  draftItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        {item.portionName && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                            {item.portionName} •{" "}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {formatINR(item.unitPrice)} each
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs px-1 min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold text-slate-900 dark:text-white ml-3 w-16 text-right">
                        {formatINR(item.subtotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Financial Summary & Submit Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-2.5 flex-shrink-0">
                {/* Packaging Fee & KDS Toggle */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 dark:text-slate-400">Packaging Fee:</span>
                    <div className="relative w-20">
                      <span className="text-xs text-slate-400 absolute left-2 top-1">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={packagingCharge}
                        onChange={(e) => setPackagingCharge(e.target.value)}
                        className="w-full pl-5 pr-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sendToKDS}
                      onChange={(e) => setSendToKDS(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                    <span>Send KOT to Kitchen</span>
                  </label>
                </div>

                {/* Subtotal & Tax details */}
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatINR(taxableAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (CGST 2.5% + SGST 2.5%)</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatINR(taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span>Total Zomato Order:</span>
                    </span>
                    <span className="font-mono text-base text-red-600 dark:text-red-400">
                      {formatINR(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Zomato Reference Order ({formatINR(finalTotal)})</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Logged Zomato Orders */}
        {activeTab === "LOG" && (
          <div className="flex-1 min-h-0 flex flex-col p-5 overflow-hidden">
            {/* Log Metrics Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 flex-shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Total Zomato Revenue
                </span>
                <span className="font-mono text-xl font-bold text-red-600 dark:text-red-400">
                  {formatINR(totalZomatoEarnings)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Platform settled direct
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Today&apos;s Zomato Earnings
                </span>
                <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                  {formatINR(todayZomatoEarnings)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Active day volume
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Total Logged Orders
                </span>
                <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                  {zomatoOrders.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Delivery reference tickets
                </span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Order / Zomato ID</th>
                    <th className="px-4 py-3">Time &amp; Date</th>
                    <th className="px-4 py-3">Customer / Rider</th>
                    <th className="px-4 py-3">Items Ordered</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {zomatoOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No Zomato orders logged yet. Switch to &quot;+ Add Zomato Items&quot; to record your first reference.
                      </td>
                    </tr>
                  ) : (
                    zomatoOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              #{order.orderNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {order.zomatoOrderId || "ZOMATO"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div>
                            {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <div>{order.customerName || "Zomato Customer"}</div>
                          {order.customerPhone && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {order.customerPhone}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                          {formatINR(order.finalTotal)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            PAID (Zomato)
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/bill/${order.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
                              title="View Digital Receipt"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteOrder(order.id, order.orderNumber, order.zomatoOrderId)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Reference"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal for Deleting Order Reference */}
        <ConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteOrder}
          title="Delete Order Reference"
          description={`Are you sure you want to delete reference record for order #${deleteTarget?.orderNumber}${deleteTarget?.zId ? ` (${deleteTarget.zId})` : ""}?`}
          confirmText="Delete Record"
          cancelText="Keep Record"
          variant="danger"
        />
      </div>
    </div>,
    document.body
  );
}
