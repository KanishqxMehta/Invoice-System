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
  convertOrderToTakeaway,
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
  Store,
  Shield,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

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
  const [isTableTransferMode, setIsTableTransferMode] = useState<boolean>(false);
  const [tables, setTables] = useState<string[]>(DEFAULT_TABLES);
  const [showTableManager, setShowTableManager] = useState<boolean>(false);

  const handleOpenTableSelector = (isTransfer: boolean = false) => {
    setIsTableTransferMode(isTransfer);
    setShowTableSelector(true);
  };

  // Resizable & Retractable Cart States
  const [cartWidth, setCartWidth] = useState<number>(440);
  const [isCartCollapsed, setIsCartCollapsed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Auth Context
  const { user, activeCafe, isSuperAdmin } = useAuth();

  const loadData = (targetOrderId?: unknown) => {
    setMenuItems(getMenuItems());
    setSettings(getSettings());
    const openOrders = getRunningOrders();
    setRunningOrders(openOrders);

    const currentTables = getTables();
    setTables(currentTables);
    if (currentTables.length > 0 && !currentTables.includes(selectedTable)) {
      setSelectedTable(currentTables[0]);
    }

    if (typeof targetOrderId === "string" && targetOrderId) {
      const target = openOrders.find((o) => o.id === targetOrderId);
      if (target) {
        setActiveRunningOrder(target);
        if (target.tableNumber) {
          setSelectedTable(target.tableNumber);
        }
        return;
      }
    }

    // If active running order was updated or settled, refresh its reference safely
    setActiveRunningOrder((prev) => {
      if (!prev) return null;
      const refreshed = openOrders.find((o) => o.id === prev.id);
      return refreshed || null;
    });
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
    const openOrders = getRunningOrders();
    const existing = openOrders.find((o) => o.tableNumber === tbl);
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
      setOrderType("DINE_IN");
      setActiveRunningOrder(updated);
      loadData();
    }
  };

  // Convert an Active Running Order to Takeaway
  const handleMoveToTakeaway = (orderId: string) => {
    const updated = convertOrderToTakeaway(orderId);
    if (updated) {
      setOrderType("TAKEAWAY");
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
        setIsTableTransferMode(false);
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
      {/* MAIN SCREEN SPLIT: (TOP BAR + MENU) on Left, CART on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Left: Top Action Bar & Menu Grid */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          
          {/* TOP COMPACT ACTION BAR */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 select-none z-10 relative">
            
            {/* Left: Auth Context */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {activeCafe && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  {isSuperAdmin ? (
                    <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  ) : (
                    <Store className="w-4 h-4 text-amber-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                      {activeCafe.branchCode}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Table Selection & Cart Toggle (when closed) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Active Tabs */}
              {runningOrders.length > 0 && (
                <button
                  onClick={() => handleOpenTableSelector(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold transition-all shadow-sm flex-shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="hidden sm:inline">{runningOrders.length} Open Tabs</span>
                  <span className="font-mono ml-1 text-emerald-600 dark:text-emerald-300">
                    ({formatINR(runningOrders.reduce((sum, o) => sum + o.finalTotal, 0))})
                  </span>
                </button>
              )}

              {/* Table Picker Pill */}
              <button
                onClick={() => handleOpenTableSelector(false)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex-shrink-0 border ${
                  orderType === "TAKEAWAY"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                    : activeRunningOrder
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {orderType === "TAKEAWAY" ? (
                  <ShoppingBag className="w-4 h-4" />
                ) : activeRunningOrder ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                ) : (
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                )}
                
                <div className="flex items-center gap-1.5">
                  <span>{orderType === "TAKEAWAY" ? "Takeaway" : `Table ${selectedTable}`}</span>
                  {activeRunningOrder && (
                    <span className="text-[10px] font-mono ml-1 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-200 bg-amber-500/10 dark:bg-black/20">
                      {formatINR(activeRunningOrder.finalTotal)}
                    </span>
                  )}
                  {activeRunningOrder && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                      (#{activeRunningOrder.orderNumber})
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              </button>

              <button
                onClick={() => setShowTableManager(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Tables ({tables.length})</span>
              </button>

              {/* Show Cart Button (Only rendered when cart is collapsed) */}
              {isCartCollapsed && (
                <button
                  onClick={handleToggleCartCollapse}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border bg-amber-600 hover:bg-amber-500 text-white border-amber-500"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Show Cart</span>
                  {totalCartCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-white text-amber-600">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 min-h-0 relative">
            <MenuGrid
              menuItems={menuItems}
              onAddToCart={handleAddToCart}
              onRefreshMenu={loadData}
              isLoading={!isMounted}
            />
          </div>
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
            <div className="flex flex-col gap-1.5 items-center opacity-30 group-hover:opacity-100 transition-opacity">
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
            onOpenTableSelector={() => handleOpenTableSelector(false)}
            onOpenTableTransfer={() => handleOpenTableSelector(true)}
            onTransferTable={handleTransferTable}
            onMoveToTakeaway={handleMoveToTakeaway}
          />
        </section>
      </div>

      {/* 2D Table Floor & Quick Selector Modal */}
      <TableSelectorModal
        isOpen={showTableSelector}
        onClose={() => {
          setShowTableSelector(false);
          setIsTableTransferMode(false);
        }}
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
        onMoveToTakeaway={handleMoveToTakeaway}
        initialTransferMode={isTableTransferMode}
        onClearDraftCart={() => setCart([])}
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
