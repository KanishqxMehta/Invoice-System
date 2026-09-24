"use client";

import React, { useState, useEffect } from "react";
import {
  CartItem,
  Customer,
  Coupon,
  PaymentMethod,
  OrderType,
  CafeSettings,
  Order,
  KOTTicket,
  OrderItemSnapshot,
} from "@/lib/types";
import { calculateBill, formatINR } from "@/lib/calculator";
import {
  createOrderAndKOT,
  addItemsToRunningOrder,
  settleRunningOrder,
  cancelRunningOrder,
  getTables,
  DEFAULT_TABLES,
} from "@/lib/storage";
import { dispatchDigitalReceiptNotification } from "@/lib/notifications";
import CustomerDrawer from "./CustomerDrawer";
import CouponInput from "./CouponInput";
import Numpad from "./Numpad";
import UPIModal from "./UPIModal";
import ThermalPrintModal from "./ThermalPrintModal";
import BillerInvoicePreviewModal from "./BillerInvoicePreviewModal";
import LoyaltyAwardModal from "./LoyaltyAwardModal";
import ConfirmModal from "./ConfirmModal";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  QrCode,
  CreditCard,
  Gift,
  Banknote,
  Printer,
  Sparkles,
  Utensils,
  ShoppingBag,
  CheckCircle2,
  Calculator,
  Eye,
  FileText,
  Clock,
  Send,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface Props {
  cart: CartItem[];
  onUpdateQuantity: (lineId: string, delta: number) => void;
  onSetQuantity: (lineId: string, quantity: number) => void;
  onRemoveItem: (lineId: string) => void;
  onClearCart: () => void;
  settings: CafeSettings;
  activeRunningOrder?: Order | null;
  onSelectRunningOrder?: (order: Order | null) => void;
  onRefreshOrders?: () => void;
  selectedTable?: string;
  onSelectTable?: (table: string) => void;
  onToggleCollapse?: () => void;
  tables?: string[];
  onOpenTableManager?: () => void;
  orderType?: OrderType;
  onSelectOrderType?: (type: OrderType) => void;
  onOpenTableSelector?: () => void;
}

export default function Cart({
  cart,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onClearCart,
  settings,
  activeRunningOrder = null,
  onSelectRunningOrder,
  onRefreshOrders,
  selectedTable = "T-01",
  onSelectTable,
  onToggleCollapse,
  tables,
  onOpenTableManager,
  orderType: propOrderType,
  onSelectOrderType,
  onOpenTableSelector,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const availableTables = isMounted
    ? (tables && tables.length > 0 ? tables : getTables())
    : (tables && tables.length > 0 ? tables : DEFAULT_TABLES);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [redeemPointsChecked, setRedeemPointsChecked] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [orderType, setOrderType] = useState<OrderType>(propOrderType || "DINE_IN");
  const [tableNumber, setTableNumber] = useState(selectedTable);

  useEffect(() => {
    if (propOrderType !== undefined) {
      setOrderType(propOrderType);
    }
  }, [propOrderType]);

  const handleSetOrderType = (newType: OrderType) => {
    setOrderType(newType);
    if (onSelectOrderType) {
      onSelectOrderType(newType);
    }
  };
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI_QR");
  const [cashTendered, setCashTendered] = useState("");
  const [notes, setNotes] = useState("");

  // UI Modals & Panels
  const [showNumpad, setShowNumpad] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [numpadValue, setNumpadValue] = useState("");
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showBillerPreview, setShowBillerPreview] = useState(false);

  // Cashier loyalty award overrides
  const [overrideLoyaltyPercent, setOverrideLoyaltyPercent] = useState<number | null>(null);
  const [overridePointsEarned, setOverridePointsEarned] = useState<number | null>(null);
  const [showLoyaltyAwardModal, setShowLoyaltyAwardModal] = useState(false);

  // Completed Order for Print Modal
  const [printedOrder, setPrintedOrder] = useState<Order | null>(null);
  const [printedKOT, setPrintedKOT] = useState<KOTTicket | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  // Sync tableNumber if selectedTable prop changes
  useEffect(() => {
    if (selectedTable) {
      setTableNumber(selectedTable);
    }
  }, [selectedTable]);

  // Sync running order details if activeRunningOrder changes
  useEffect(() => {
    if (activeRunningOrder) {
      if (activeRunningOrder.tableNumber) {
        setTableNumber(activeRunningOrder.tableNumber);
        handleSetOrderType("DINE_IN");
      } else {
        handleSetOrderType(activeRunningOrder.orderType);
      }
      if (activeRunningOrder.customerName || activeRunningOrder.customerPhone) {
        setCustomer({
          id: activeRunningOrder.customerId || `cust-${Date.now()}`,
          name: activeRunningOrder.customerName || "Guest",
          phone: activeRunningOrder.customerPhone || "",
          pointsBalance: 0,
          totalSpent: activeRunningOrder.finalTotal,
          visitCount: 1,
          createdAt: activeRunningOrder.createdAt,
        });
      }
    }
  }, [activeRunningOrder]);

  // Combined items for calculation: (Existing Running Order Items) + (New Items in Cart)
  const combinedItemsForCalc: CartItem[] = [
    ...(activeRunningOrder
      ? activeRunningOrder.items.map((snap) => ({
          lineId: snap.id,
          itemId: snap.id,
          name: snap.name,
          portionName: snap.portionName,
          basePrice: snap.unitPrice,
          quantity: snap.quantity,
          isVeg: snap.isVeg,
          modifiers: snap.modifiers || [],
          notes: snap.notes,
          unitTotal: snap.unitPrice,
          itemTotal: snap.subtotal,
        }))
      : []),
    ...cart,
  ];

  // Calculate totals using pure calculation engine on combined items
  const calculation = calculateBill({
    cart: combinedItemsForCalc,
    coupon: appliedCoupon,
    pointsToRedeem: redeemPointsChecked ? (customer?.pointsBalance || 0) : 0,
    customerPointsBalance: customer?.pointsBalance || 0,
    settings,
    overrideLoyaltyPercent,
    overridePointsEarned,
  });

  const effectiveLoyaltyPercent = overrideLoyaltyPercent !== null
    ? overrideLoyaltyPercent
    : (settings.loyaltyEarnPercent ?? 5);

  const totalItemsCount = combinedItemsForCalc.reduce((s, i) => s + i.quantity, 0);

  // Handle speed numpad quantity change
  const handleSelectLineForNumpad = (lineId: string, currentQty: number) => {
    setSelectedLineId(lineId);
    setNumpadValue(currentQty.toString());
    setShowNumpad(true);
  };

  const handleApplyNumpadQty = () => {
    if (selectedLineId && numpadValue) {
      const q = parseInt(numpadValue, 10);
      if (!isNaN(q) && q > 0) {
        onSetQuantity(selectedLineId, q);
      } else if (q === 0) {
        onRemoveItem(selectedLineId);
      }
    }
    setShowNumpad(false);
    setSelectedLineId(null);
  };

  // ---------------- ACTION 1: SEND TO KITCHEN (ORDER FIRST / PAY LATER) ----------------
  const handleSendToKitchenPayLater = () => {
    if (cart.length === 0) return;

    const result = createOrderAndKOT({
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      subtotal: calculation.subtotal,
      cgst: calculation.cgst,
      sgst: calculation.sgst,
      taxAmount: calculation.taxAmount,
      discountAmount: calculation.couponDiscount,
      couponCode: appliedCoupon?.code,
      pointsRedeemed: 0,
      pointsDiscount: 0,
      finalTotal: calculation.finalTotal,
      pointsEarned: 0,
      paymentMethod,
      paymentStatus: "PENDING", // Running order: payment pending!
      orderType,
      tableNumber: orderType === "DINE_IN" ? tableNumber : undefined,
      notes: notes.trim() || undefined,
      items: cart.map((item) => ({
        id: item.lineId,
        name: item.portionName ? `${item.name} (${item.portionName})` : item.name,
        portionName: item.portionName,
        quantity: item.quantity,
        unitPrice: item.unitTotal,
        modifiers: item.modifiers,
        notes: item.notes,
        subtotal: item.itemTotal,
        isVeg: item.isVeg,
      })),
    });

    const targetLabel = orderType === "DINE_IN" ? `Table ${tableNumber}` : `Order #${result.order.orderNumber}`;
    setToastMessage(
      `🍳 Sent to kitchen! KOT #${result.kot.kotNumber} generated for ${targetLabel}. Running tab is now active.`
    );
    setTimeout(() => setToastMessage(null), 4000);

    onClearCart();
    setNotes("");
    setShowNumpad(false);

    // Open KOT print dialog so kitchen slip is printed
    setPrintedOrder(result.order);
    setPrintedKOT(result.kot);
    setShowPrintModal(true);

    if (onRefreshOrders) onRefreshOrders();
  };

  // ---------------- ACTION 2: INCREMENTAL KOT (ADD MORE ITEMS TO RUNNING TAB) ----------------
  const handleSendIncrementalKOT = () => {
    if (!activeRunningOrder || cart.length === 0) return;

    // Calculate delta for newly added items only
    const deltaSubtotal = cart.reduce((s, i) => s + i.itemTotal, 0);
    const deltaTax = (deltaSubtotal * settings.taxRatePercent) / 100;
    const deltaTotal = deltaSubtotal + deltaTax;

    const newSnapshots: OrderItemSnapshot[] = cart.map((item) => ({
      id: `${item.lineId}-${Date.now()}`,
      name: item.portionName ? `${item.name} (${item.portionName})` : item.name,
      portionName: item.portionName,
      quantity: item.quantity,
      unitPrice: item.unitTotal,
      modifiers: item.modifiers,
      notes: item.notes,
      subtotal: item.itemTotal,
      isVeg: item.isVeg,
    }));

    const result = addItemsToRunningOrder({
      orderId: activeRunningOrder.id,
      newItems: newSnapshots,
      subtotalDelta: deltaSubtotal,
      cgstDelta: deltaTax / 2,
      sgstDelta: deltaTax / 2,
      taxDelta: deltaTax,
      finalTotalDelta: deltaTotal,
      notes: notes.trim() || undefined,
    });

    if (result) {
      setToastMessage(
        `⚡ Incremental KOT #${result.kot.kotNumber} sent to kitchen for Table ${activeRunningOrder.tableNumber || "Tab"}!`
      );
      setTimeout(() => setToastMessage(null), 4000);

      onClearCart();
      setNotes("");

      if (onSelectRunningOrder) {
        onSelectRunningOrder(result.order);
      }
      if (onRefreshOrders) {
        onRefreshOrders();
      }

      setPrintedOrder(result.order);
      setPrintedKOT(result.kot);
      setShowPrintModal(true);
    }
  };

  // ---------------- ACTION 3: SETTLE & PAY RUNNING TAB ----------------
  const handleSettleAndPay = (overridePaymentMethod?: PaymentMethod) => {
    if (!activeRunningOrder) return;
    const methodToUse = overridePaymentMethod || paymentMethod;

    // If there are unsent items in cart, add them first!
    if (cart.length > 0) {
      handleSendIncrementalKOT();
    }

    const result = settleRunningOrder({
      orderId: activeRunningOrder.id,
      paymentMethod: methodToUse,
      subtotal: calculation.subtotal,
      cgst: calculation.cgst,
      sgst: calculation.sgst,
      taxAmount: calculation.taxAmount,
      discountAmount: calculation.couponDiscount,
      couponCode: appliedCoupon?.code,
      pointsRedeemed: calculation.pointsRedeemed,
      pointsDiscount: calculation.pointsDiscount,
      finalTotal: calculation.finalTotal,
      pointsEarned: calculation.pointsEarned,
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
    });

    if (result) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      dispatchDigitalReceiptNotification({
        order: result.order,
        customer: result.customer || customer,
        settings,
        baseUrl,
      }).catch(console.error);

      setToastMessage(
        `💳 Order #${result.order.orderNumber} settled & paid via ${methodToUse}! Table released.`
      );
      setTimeout(() => setToastMessage(null), 4000);

      onClearCart();
      if (onSelectRunningOrder) {
        onSelectRunningOrder(null);
      }
      if (onRefreshOrders) {
        onRefreshOrders();
      }

      setPrintedOrder(result.order);
      setPrintedKOT(null); // Print final customer receipt
      setShowPrintModal(true);
    }
  };

  // ---------------- ACTION 4: IMMEDIATE PAY & PRINT (COUNTER CHECKOUT) ----------------
  const handleImmediatePayAndPrint = (overridePaymentMethod?: PaymentMethod) => {
    if (cart.length === 0) return;
    const methodToUse = overridePaymentMethod || paymentMethod;

    const result = createOrderAndKOT({
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      subtotal: calculation.subtotal,
      cgst: calculation.cgst,
      sgst: calculation.sgst,
      taxAmount: calculation.taxAmount,
      discountAmount: calculation.couponDiscount,
      couponCode: appliedCoupon?.code,
      pointsRedeemed: calculation.pointsRedeemed,
      pointsDiscount: calculation.pointsDiscount,
      finalTotal: calculation.finalTotal,
      pointsEarned: calculation.pointsEarned,
      paymentMethod: methodToUse,
      paymentStatus: "PAID",
      orderType,
      tableNumber: orderType === "DINE_IN" ? tableNumber : undefined,
      notes: notes.trim() || undefined,
      items: cart.map((item) => ({
        id: item.lineId,
        name: item.portionName ? `${item.name} (${item.portionName})` : item.name,
        portionName: item.portionName,
        quantity: item.quantity,
        unitPrice: item.unitTotal,
        modifiers: item.modifiers,
        notes: item.notes,
        subtotal: item.itemTotal,
        isVeg: item.isVeg,
      })),
    });

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    dispatchDigitalReceiptNotification({
      order: result.order,
      customer: result.customer || customer,
      settings,
      baseUrl,
    }).catch(console.error);

    const orderLabel = `Order #${result.order.orderNumber}`;

    setToastMessage(
      `${orderLabel} paid & punched! KOT #${result.kot.kotNumber} generated & digital receipt queued.`
    );
    setTimeout(() => setToastMessage(null), 4000);

    onClearCart();
    setCustomer(null);
    setRedeemPointsChecked(false);
    setAppliedCoupon(null);
    setOverrideLoyaltyPercent(null);
    setOverridePointsEarned(null);
    setNotes("");
    setShowNumpad(false);

    setPrintedOrder(result.order);
    setPrintedKOT(result.kot);
    setShowPrintModal(true);

    if (onRefreshOrders) onRefreshOrders();
  };

  // Void/Cancel Running Tab
  const handleVoidRunningTab = () => {
    if (!activeRunningOrder) return;
    setShowVoidConfirm(true);
  };

  const confirmVoidRunningTab = () => {
    if (!activeRunningOrder) return;
    cancelRunningOrder(activeRunningOrder.id);
    if (onSelectRunningOrder) onSelectRunningOrder(null);
    if (onRefreshOrders) onRefreshOrders();
    setToastMessage("Active tab voided.");
    setTimeout(() => setToastMessage(null), 3000);
    setShowVoidConfirm(false);
  };

  const cashChange = cashTendered
    ? Math.max(0, parseFloat(cashTendered) - calculation.finalTotal)
    : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Cart Top Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{activeRunningOrder ? `Tab: ${activeRunningOrder.tableNumber || "Active"}` : "Billing Cart"}</span>
              <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full">
                {totalItemsCount} items
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeRunningOrder && (
            <button
              type="button"
              onClick={() => {
                if (onSelectRunningOrder) onSelectRunningOrder(null);
                onClearCart();
              }}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Release current tab from cashier view"
            >
              Close Tab
            </button>
          )}

          {totalItemsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowBillerPreview(true)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-200 dark:border-slate-700 transition-colors"
              title="Preview customer invoice and thermal bill before punching"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          )}

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear active items in cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-0.5"
              title="Collapse Billing Cart (Alt+C)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE RUNNING ORDER BANNER */}
      {activeRunningOrder && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 p-2 px-3 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-300">
                Table {activeRunningOrder.tableNumber || "Tab"} • #{activeRunningOrder.orderNumber}
              </span>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                Running Total: <strong className="text-slate-900 dark:text-slate-200">{formatINR(activeRunningOrder.finalTotal)}</strong> (Unsettled)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTableSelector && (
              <button
                type="button"
                onClick={onOpenTableSelector}
                className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 hover:underline px-2 py-0.5 rounded-lg bg-amber-200/50 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/60"
                title="Switch to another table or tab (T or F2)"
              >
                Switch Table ▾
              </button>
            )}
            <button
              type="button"
              onClick={handleVoidRunningTab}
              className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline"
            >
              Void Tab
            </button>
          </div>
        </div>
      )}

      {/* Customer Drawer Trigger */}
      <div className="px-2.5 pt-1.5 flex-shrink-0 relative z-30">
        <CustomerDrawer
          customer={customer}
          onSelectCustomer={setCustomer}
          onClearCustomer={() => {
            setCustomer(null);
            setRedeemPointsChecked(false);
            setOverrideLoyaltyPercent(null);
            setOverridePointsEarned(null);
          }}
          redeemPointsChecked={redeemPointsChecked}
          onToggleRedeemPoints={setRedeemPointsChecked}
          maxEligiblePoints={customer?.pointsBalance || 0}
          settings={settings}
        />
      </div>

      {/* Order Mode Switcher */}
      <div className="px-2.5 pt-1 space-y-1 flex-shrink-0">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {/* Dine-In */}
          <button
            type="button"
            onClick={() => handleSetOrderType("DINE_IN")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
              orderType === "DINE_IN"
                ? "bg-amber-600 text-white font-bold shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Dine-In</span>
          </button>

          {/* Takeaway */}
          <button
            type="button"
            onClick={() => handleSetOrderType("TAKEAWAY")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
              orderType === "TAKEAWAY"
                ? "bg-amber-600 text-white font-bold shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Takeaway</span>
          </button>
        </div>

        {/* Table Number for Dine-In */}
        {orderType === "DINE_IN" && !activeRunningOrder && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Table:</span>
            <div className="flex-1 flex items-center gap-1.5">
              {onOpenTableSelector ? (
                <button
                  type="button"
                  onClick={onOpenTableSelector}
                  className="flex-1 flex items-center justify-between text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 transition-colors font-mono"
                  title="Click to view all tables and switch (T or F2)"
                >
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tableNumber.toLowerCase().startsWith("table") ? tableNumber : `Table ${tableNumber}`}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Change ▾</span>
                </button>
              ) : (
                <select
                  suppressHydrationWarning
                  value={availableTables.includes(tableNumber) ? tableNumber : "__CUSTOM__"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== "__CUSTOM__") {
                      setTableNumber(val);
                      if (onSelectTable) onSelectTable(val);
                    }
                  }}
                  className="flex-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  {availableTables.map((t) => (
                    <option key={t} value={t}>
                      {t.toLowerCase().startsWith("table") ? t : `Table ${t}`}
                    </option>
                  ))}
                  {!availableTables.includes(tableNumber) && (
                    <option value="__CUSTOM__">
                      {tableNumber.toLowerCase().startsWith("table") ? tableNumber : `Table ${tableNumber}`} (Custom)
                    </option>
                  )}
                </select>
              )}

              {onOpenTableManager && (
                <button
                  type="button"
                  onClick={onOpenTableManager}
                  className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                  title="Configure dining tables"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Setup</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Items List - Independent Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 overscroll-contain">
        {/* SECTION 1: ALREADY SENT ITEMS ON ACTIVE RUNNING ORDER */}
        {activeRunningOrder && activeRunningOrder.items.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Sent to Kitchen (KOT #{activeRunningOrder.kotNumber})</span>
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{formatINR(activeRunningOrder.subtotal)}</span>
            </div>

            <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
              {activeRunningOrder.items.map((sentItem, sentIdx) => (
                <div
                  key={sentIdx}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-800/40 last:border-0"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        sentItem.isVeg ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {sentItem.name}
                    </span>
                    {sentItem.portionName && (
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-transparent">
                        {sentItem.portionName}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      x{sentItem.quantity}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-300">
                    {formatINR(sentItem.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: NEW ITEMS ADDED IN THIS ROUND */}
        <div className="space-y-1.5">
          {activeRunningOrder && (
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider px-1">
              <span>⚡ New Add-ons (This Round)</span>
              {cart.length > 0 && (
                <span className="font-mono text-amber-700 dark:text-amber-300">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              )}
            </div>
          )}

          {cart.length === 0 ? (
            !activeRunningOrder ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                <ShoppingCart className="w-6 h-6 stroke-[1.5] mb-1.5 opacity-40 text-slate-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Cart is empty</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                  Click dishes or press <kbd className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 rounded font-mono border border-slate-200 dark:border-slate-700">/</kbd> to search
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic px-2 py-1">
                No new add-ons yet. Click dishes on the menu to add to Table {activeRunningOrder.tableNumber || "Tab"}.
              </p>
            )
          ) : (
            cart.map((item) => {
              const isSelectedForNumpad = selectedLineId === item.lineId;
              return (
                <div
                  key={item.lineId}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSelectedForNumpad
                      ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20"
                      : "border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.isVeg ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {item.portionName && (
                          <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                            {item.portionName}
                          </span>
                        )}
                      </div>

                      {/* Modifiers Badges */}
                      {item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-4">
                          {item.modifiers.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-mono"
                            >
                              +{m.name} ({formatINR(m.price)})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Note Tag */}
                      {item.notes && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pl-4 mt-0.5">
                          Note: &ldquo;{item.notes}&rdquo;
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4 mt-1 font-mono">
                        {formatINR(item.unitTotal)} each
                      </div>
                    </div>

                    {/* Quantity and Row Total */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-400">
                        {formatINR(item.itemTotal)}
                      </span>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.lineId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSelectLineForNumpad(item.lineId, item.quantity)
                          }
                          className="w-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:underline"
                          title="Click to set quantity via numpad"
                        >
                          {item.quantity}
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.lineId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Speed Numpad Drawer */}
        {showNumpad && (
          <div className="p-2 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                <span>Speed Quantity Numpad</span>
              </span>
              <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-slate-900 dark:text-white">
                Qty: {numpadValue || "0"}
              </span>
            </div>
            <Numpad
              value={numpadValue}
              onChange={setNumpadValue}
              onApply={handleApplyNumpadQty}
              onClose={() => setShowNumpad(false)}
            />
          </div>
        )}
      </div>

      {/* Cart Bottom: Financials, Payment & Multi-Mode Checkout Buttons */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/90 space-y-2 flex-shrink-0">
        {/* Coupon Input */}
        <CouponInput
          appliedCoupon={appliedCoupon}
          onApplyCoupon={setAppliedCoupon}
          onRemoveCoupon={() => setAppliedCoupon(null)}
          subtotal={calculation.subtotal}
          settings={settings}
        />

        {/* Financial Calculation Breakdown - Compact */}
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Item Subtotal:</span>
            <span className="font-mono text-slate-800 dark:text-slate-300">
              {formatINR(calculation.subtotal)}
            </span>
          </div>

          {calculation.couponDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Coupon Discount:</span>
              <span className="font-mono">
                -{formatINR(calculation.couponDiscount)}
              </span>
            </div>
          )}

          {calculation.pointsDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Loyalty Points Discount:</span>
              <span className="font-mono">
                -{formatINR(calculation.pointsDiscount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>GST 5% (CGST 2.5% + SGST 2.5%):</span>
            <span className="font-mono text-slate-800 dark:text-slate-300">
              {formatINR(calculation.taxAmount)}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              {activeRunningOrder ? "Total Tab:" : "Final Total:"}
            </span>
            <div className="text-right">
              <span className="font-mono text-lg font-black text-amber-700 dark:text-amber-400">
                {formatINR(calculation.finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Cashier Loyalty Points Award Controller - Sleek 1-Line Row */}
        {customer && (
          <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 truncate">
              <Gift className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Award to {customer.name}:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">+{calculation.pointsEarned} pts</strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                ({overridePointsEarned !== null ? "Custom" : `${effectiveLoyaltyPercent}% cashback`})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowLoyaltyAwardModal(true)}
              className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
            >
              Set Rate
            </button>
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPaymentMethod("UPI_QR")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                paymentMethod === "UPI_QR"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                paymentMethod === "CASH"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                paymentMethod === "CARD"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
          </div>

          {paymentMethod === "UPI_QR" && (
            <button
              type="button"
              disabled={calculation.finalTotal <= 0}
              onClick={() => setShowUPIModal(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:text-white text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title={calculation.finalTotal <= 0 ? "Add items to generate dynamic UPI QR" : "Show Dynamic UPI QR to Customer"}
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Show Dynamic UPI QR to Customer</span>
            </button>
          )}

          {paymentMethod === "CASH" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="number"
                placeholder="Cash Tendered (₹)"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {cashChange > 0 && (
                <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Change: {formatINR(cashChange)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------------- MULTI-MODE ACTION BUTTONS ---------------- */}
        {activeRunningOrder ? (
          /* MODE: ACTIVE RUNNING ORDER LOADED */
          <div className="space-y-1.5">
            {/* If new add-ons are in cart: button to send ONLY add-ons to kitchen */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleSendIncrementalKOT}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-[0.98] transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send {cart.reduce((s, i) => s + i.quantity, 0)} Add-on(s) to Kitchen (KOT)</span>
              </button>
            )}

            {/* Settle Bill Button */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShowBillerPreview(true)}
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700 transition-all"
                title="Preview full bill before collecting payment"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={() => handleSettleAndPay()}
                className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg active:scale-[0.98] transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SETTLE BILL &amp; PAY ({formatINR(calculation.finalTotal)})</span>
              </button>
            </div>
          </div>
        ) : (
          /* MODE: NEW ORDER (CHOOSE PAY IMMEDIATELY OR ORDER FIRST / PAY LATER) */
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              {/* Option A: Send to Kitchen (Pay Later / Hold Tab) */}
              <button
                type="button"
                onClick={handleSendToKitchenPayLater}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 hover:border-amber-400 dark:hover:border-amber-500 active:scale-[0.98] transition-all"
                title="Send items to kitchen now; customer will pay at the end of their meal"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Kitchen (Pay Later)</span>
              </button>

              {/* Option B: Pay & Print Immediately */}
              <button
                type="button"
                onClick={() => handleImmediatePayAndPrint()}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md active:scale-[0.98] transition-all"
                title="Collect payment right away and print receipt"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>Pay &amp; Print Now</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic UPI Modal */}
      <UPIModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={calculation.finalTotal}
        upiId={settings.upiId}
        payeeName={settings.upiPayeeName}
        orderNumber={activeRunningOrder ? activeRunningOrder.orderNumber : (cart.length > 0 ? "LIVE-CART" : "ORD-PREVIEW")}
        onPaymentSuccess={() => {
          setShowUPIModal(false);
          setPaymentMethod("UPI_QR");
          if (activeRunningOrder) {
            handleSettleAndPay("UPI_QR");
          } else if (cart.length > 0) {
            handleImmediatePayAndPrint("UPI_QR");
          } else {
            setToastMessage("UPI Payment verified. Add items to order to generate invoice.");
            setTimeout(() => setToastMessage(null), 3500);
          }
        }}
      />

      {/* Biller Live Invoice Preview Modal */}
      <BillerInvoicePreviewModal
        isOpen={showBillerPreview}
        onClose={() => setShowBillerPreview(false)}
        cart={combinedItemsForCalc}
        customer={customer}
        appliedCoupon={appliedCoupon}
        calculation={calculation}
        orderType={orderType}
        tableNumber={tableNumber}
        paymentMethod={paymentMethod}
        notes={notes}
        settings={settings}
        onConfirmPunchAndPrint={activeRunningOrder ? handleSettleAndPay : handleImmediatePayAndPrint}
      />

      {/* Thermal Print Modal */}
      {printedOrder && (
        <ThermalPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          order={printedOrder}
          kot={printedKOT || {
            id: `kot-${Date.now()}`,
            kotNumber: printedOrder.kotNumber,
            orderId: printedOrder.id,
            orderNumber: printedOrder.orderNumber,
            orderType: printedOrder.orderType,
            tableNumber: printedOrder.tableNumber,
            status: "ACTIVE",
            items: printedOrder.items,
            createdAt: printedOrder.createdAt,
          }}
          settings={settings}
        />
      )}

      {/* Loyalty Points Award Setting Modal */}
      {customer && (
        <LoyaltyAwardModal
          isOpen={showLoyaltyAwardModal}
          onClose={() => setShowLoyaltyAwardModal(false)}
          customerName={customer.name}
          orderTotal={calculation.finalTotal}
          defaultPercent={settings.loyaltyEarnPercent ?? 5}
          currentPercent={overrideLoyaltyPercent}
          currentFixedPoints={overridePointsEarned}
          onApplyRate={(pct, fixedPts) => {
            setOverrideLoyaltyPercent(pct);
            setOverridePointsEarned(fixedPts);
          }}
        />
      )}

      {/* Custom Confirmation Modal for Voiding Table Tab */}
      <ConfirmModal
        isOpen={showVoidConfirm}
        onClose={() => setShowVoidConfirm(false)}
        onConfirm={confirmVoidRunningTab}
        title="Void Active Table Tab"
        description={`Are you sure you want to void the tab for Table ${activeRunningOrder?.tableNumber || "Tab"} (#${activeRunningOrder?.orderNumber})? Any unsaved orders or pending items will be cleared.`}
        confirmText="Yes, Void Tab"
        cancelText="Keep Tab Active"
        variant="danger"
      />
    </div>
  );
}
