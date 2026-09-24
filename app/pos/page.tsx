"use client";

import React, { useState, useEffect } from "react";
import MenuGrid from "@/components/MenuGrid";
import Cart from "@/components/Cart";
import {
  MenuItem,
  CartItem,
  CartModifier,
  CafeSettings,
  PortionVariant,
  Order,
  OrderType,
} from "@/lib/types";
import {
  getMenuItems,
  getSettings,
  getRunningOrders,
  getTables,
  transferRunningOrderTable,
  DEFAULT_CAFE_SETTINGS,
  DEFAULT_TABLES,
} from "@/lib/storage";
import TableManagerModal from "@/components/TableManagerModal";
import TableSelectorModal from "@/components/TableSelectorModal";
import { calculateCartItemTotal, formatINR } from "@/lib/calculator";
import {
  Utensils,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  ShoppingBag,
  Layers,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

export default function PosPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_CAFE_SETTINGS);
  const [runningOrders, setRunningOrders] = useState<Order[]>([]);
  const [activeRunningOrder, setActiveRunningOrder] = useState<Order | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("T-01");
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [showTableSelector, setShowTableSelector] = useState<boolean>(false);
  const [tables, setTables] = useState<string[]>(DEFAULT_TABLES);
  const [showTableManager, setShowTableManager] = useState<boolean>(false);

  // Resizable & Retractable Cart States
  const [cartWidth, setCartWidth] = useState<number>(440);
  const [isCartCollapsed, setIsCartCollapsed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const loadData = () => {
    setMenuItems(getMenuItems());
    setSettings(getSettings());
    const openOrders = getRunningOrders();
    setRunningOrders(openOrders);

    const currentTables = getTables();
    setTables(currentTables);
    if (currentTables.length > 0 && !currentTables.includes(selectedTable)) {
      setSelectedTable(currentTables[0]);
    }

    // If active running order was updated or settled, refresh its reference
    if (activeRunningOrder) {
      const refreshed = openOrders.find((o) => o.id === activeRunningOrder.id);
      setActiveRunningOrder(refreshed || null);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadData();

    // Listen for tab focus or storage updates
    window.addEventListener("focus", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("focus", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  // Load saved cart preferences (width and collapsed state)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("pos_cart_width");
      if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        if (!isNaN(w) && w >= 320 && w <= 700) {
          setCartWidth(w);
        }
      }
      const savedCollapsed = localStorage.getItem("pos_cart_collapsed");
      if (savedCollapsed === "true") {
        setIsCartCollapsed(true);
      }
    }
  }, []);

  const handleToggleCartCollapse = () => {
    setIsCartCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pos_cart_collapsed", String(next));
      return next;
    });
  };

  // Alt+C keyboard shortcut to toggle cart collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleToggleCartCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mouse Drag handler for cart width resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = cartWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const minW = 340;
      const maxW = Math.min(680, window.innerWidth * 0.55);
      const newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX));
      setCartWidth(Math.round(newWidth));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setCartWidth((w) => {
        localStorage.setItem("pos_cart_width", String(w));
        return w;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Select Table Handler
  const handleSelectTable = (tbl: string) => {
    setSelectedTable(tbl);
    setOrderType("DINE_IN");
    const existing = runningOrders.find((o) => o.tableNumber === tbl);
    if (existing) {
      setActiveRunningOrder(existing);
    } else {
      setActiveRunningOrder(null);
    }
  };

  // Transfer / Shift Table for an Active Running Order (Pay Later Tab)
  const handleTransferTable = (orderId: string, newTable: string) => {
    const updated = transferRunningOrderTable(orderId, newTable);
    if (updated) {
      setSelectedTable(newTable);
      setActiveRunningOrder(updated);
      loadData();
    }
  };

  // Start Fresh Counter Order
  const handleStartFreshOrder = () => {
    setActiveRunningOrder(null);
    setCart([]);
    const currentTables = getTables();
    setSelectedTable(currentTables[0] || "T-01");
    setOrderType("DINE_IN");
  };

  // Keyboard shortcut: Press T or F2 to open Table Selector Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (
        e.key === "F2" ||
        (!isInput &&
          (e.key === "t" || e.key === "T") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey)
      ) {
        e.preventDefault();
        setShowTableSelector((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Add item with portion and modifiers to cart
  const handleAddToCart = (
    item: MenuItem,
    portion: PortionVariant | null,
    modifiers: CartModifier[],
    notes: string,
    quantity: number
  ) => {
    const modifierKey = modifiers
      .map((m) => m.name)
      .sort()
      .join("|");
    const portionKey = portion ? portion.id : "standard";
    const lineId = `${item.id}-${portionKey}-${modifierKey}-${notes}`;

    const basePrice = portion ? portion.price : item.price;
    const { unitTotal, itemTotal } = calculateCartItemTotal(
      basePrice,
      modifiers,
      quantity
    );

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((ci) => ci.lineId === lineId);
      if (existingIdx >= 0) {
        const existing = prevCart[existingIdx];
        const newQty = existing.quantity + quantity;
        const updatedItemTotal = existing.unitTotal * newQty;
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          itemTotal: updatedItemTotal,
        };
        return updated;
      } else {
        const newCartItem: CartItem = {
          lineId,
          itemId: item.id,
          name: item.name,
          portionName: portion ? portion.name : undefined,
          basePrice,
          quantity,
          isVeg: item.isVeg,
          modifiers,
          notes: notes || undefined,
          unitTotal,
          itemTotal,
        };
        return [...prevCart, newCartItem];
      }
    });
  };

  const handleUpdateQuantity = (lineId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.lineId === lineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              itemTotal: item.unitTotal * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleSetQuantity = (lineId: string, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.lineId !== lineId);
      }
      return prevCart.map((item) => {
        if (item.lineId === lineId) {
          return {
            ...item,
            quantity,
            itemTotal: item.unitTotal * quantity,
          };
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (lineId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.lineId !== lineId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartCount =
    cart.reduce((sum, item) => sum + item.quantity, 0) +
    (activeRunningOrder ? activeRunningOrder.items.reduce((sum, item) => sum + item.quantity, 0) : 0);

  const totalCartSubtotal =
    cart.reduce((sum, item) => sum + item.itemTotal, 0) +
    (activeRunningOrder ? activeRunningOrder.finalTotal : 0);

  return (
    <div className="flex-1 flex flex-col h-full max-h-full min-h-0 overflow-hidden bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* TOP COMPACT ACTION BAR (Speed-first table & tab navigation) */}
      <div className="px-3.5 py-2 bg-white dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 flex-shrink-0 select-none shadow-xs">
        {/* Left: Quick Actions & Table Selector Pill */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* New Order Button */}
          <button
            type="button"
            onClick={handleStartFreshOrder}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
              !activeRunningOrder && cart.length === 0
                ? "bg-amber-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
            title="Start a fresh counter order or new tab"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Interactive Table Picker Pill */}
          <button
            type="button"
            onClick={() => setShowTableSelector(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 border ${
              orderType === "TAKEAWAY"
                ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-500"
                : activeRunningOrder
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/40"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            }`}
            title="Click to view all tables or switch (Keyboard: T or F2)"
          >
            {orderType === "TAKEAWAY" ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway / Counter</span>
              </>
            ) : activeRunningOrder ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-mono">Table {selectedTable}</span>
                <span className="font-mono font-bold text-[11px] text-amber-700 dark:text-amber-300">
                  {formatINR(activeRunningOrder.finalTotal)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  (#{activeRunningOrder.orderNumber})
                </span>
              </>
            ) : (
              <>
                <Utensils className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-mono">Table {selectedTable}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  (Available)
                </span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 ml-0.5" />
          </button>

          {/* Running Tabs Quick Counter Button */}
          {runningOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTableSelector(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 font-bold text-xs transition-all shadow-xs flex-shrink-0"
              title="View and switch between active open table tabs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{runningOrders.length} Open Tabs</span>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">
                ({formatINR(runningOrders.reduce((sum, o) => sum + o.finalTotal, 0))})
              </span>
            </button>
          )}

          {/* Subtle Keyboard hint */}
          <span className="hidden xl:inline text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">T</kbd> for Tables
          </span>
        </div>

        {/* Right side: Table Management & Cart Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowTableManager(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Configure, scale, or add custom dining tables"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tables ({tables.length})</span>
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Retractable Cart Toggle Button */}
          <button
            type="button"
            onClick={handleToggleCartCollapse}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isCartCollapsed
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
            title="Toggle cart panel visibility (Alt+C)"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isCartCollapsed ? "Show Cart" : "Hide Cart"}</span>
            {totalCartCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isCartCollapsed
                    ? "bg-white text-amber-700"
                    : "bg-amber-500 text-white"
                }`}
              >
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dragging transparent overlay to prevent losing pointer events */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      {/* MAIN SCREEN SPLIT: MENU GRID + RESIZABLE/RETRACTABLE CART */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        {/* Left: Menu & Category Grid */}
        <section className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <MenuGrid
            menuItems={menuItems}
            onAddToCart={handleAddToCart}
            onRefreshMenu={loadData}
            isLoading={!isMounted}
          />

          {/* Floating Expand Cart pill when cart is collapsed */}
          {isCartCollapsed && (
            <div className="absolute bottom-5 right-5 z-30 animate-in fade-in slide-in-from-right-3 duration-200">
              <button
                type="button"
                onClick={handleToggleCartCollapse}
                className="flex items-center gap-2.5 px-4 py-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-2xl shadow-2xl border border-amber-400/40 font-bold text-xs transition-all group"
                title="Expand Billing Cart (Alt+C)"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-amber-600">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-tight">
                    {totalCartCount > 0
                      ? `${totalCartCount} items • ${formatINR(totalCartSubtotal)}`
                      : "Open Cart"}
                  </span>
                  <span className="text-[10px] text-amber-200 font-normal">
                    Press Alt+C to Expand ◀
                  </span>
                </div>
              </button>
            </div>
          )}
        </section>

        {/* Vertical Resize Divider Handle */}
        {!isCartCollapsed && (
          <div
            onMouseDown={handleMouseDownResize}
            className={`hidden md:flex w-2.5 hover:w-3 bg-slate-100 hover:bg-amber-500/25 dark:bg-slate-900 dark:hover:bg-amber-500/30 border-l border-r border-slate-200 dark:border-slate-800 cursor-col-resize items-center justify-center transition-all group flex-shrink-0 select-none ${
              isDragging ? "bg-amber-500/40 ring-2 ring-amber-500" : ""
            }`}
            title="Drag to resize billing cart width (Double-click to reset to 440px)"
            onDoubleClick={() => {
              setCartWidth(440);
              localStorage.setItem("pos_cart_width", "440");
            }}
          >
            <div className="flex flex-col gap-1 items-center opacity-30 group-hover:opacity-100 transition-opacity">
              <span className="w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
              <span className="w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
              <span className="w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
            </div>
          </div>
        )}

        {/* Right: Interactive Speed Cart (Resizable & Retractable) */}
        <section
          style={{
            width: isCartCollapsed ? 0 : `${cartWidth}px`,
            display: isCartCollapsed ? "none" : undefined,
          }}
          className="w-full flex-shrink-0 flex flex-col min-h-0 overflow-hidden transition-[width] duration-100 ease-out"
        >
          <Cart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            settings={settings}
            activeRunningOrder={activeRunningOrder}
            onSelectRunningOrder={setActiveRunningOrder}
            onRefreshOrders={loadData}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            onToggleCollapse={handleToggleCartCollapse}
            tables={tables}
            onOpenTableManager={() => setShowTableManager(true)}
            orderType={orderType}
            onSelectOrderType={setOrderType}
            onOpenTableSelector={() => setShowTableSelector(true)}
            onTransferTable={handleTransferTable}
          />
        </section>
      </div>

      {/* 2D Table Floor & Quick Selector Modal */}
      <TableSelectorModal
        isOpen={showTableSelector}
        onClose={() => setShowTableSelector(false)}
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        runningOrders={runningOrders}
        onSelectRunningOrder={setActiveRunningOrder}
        orderType={orderType}
        onSelectOrderType={setOrderType}
        onOpenTableManager={() => setShowTableManager(true)}
        activeRunningOrder={activeRunningOrder}
        onTransferTable={handleTransferTable}
      />

      {/* Table Manager Modal */}
      <TableManagerModal
        isOpen={showTableManager}
        onClose={() => setShowTableManager(false)}
        runningOrders={runningOrders}
        onTablesUpdated={(updated) => {
          setTables(updated);
          loadData();
        }}
      />
    </div>
  );
}
