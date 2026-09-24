import {
  MenuItem,
  Customer,
  Coupon,
  Order,
  KOTTicket,
  NotificationLog,
  CafeSettings,
  PointsLedgerEntry,
  KOTStatus,
  PaymentMethod,
  OrderType,
  OrderItemSnapshot,
  CustomInvoice,
  PaymentStatus,
  SalesSummary,
} from "./types";
import {
  DEFAULT_CAFE_SETTINGS,
  DEFAULT_TABLES,
  INITIAL_MENU_ITEMS,
  INITIAL_CUSTOMERS,
  INITIAL_COUPONS,
  INITIAL_POINTS_LEDGER,
  INITIAL_SAMPLE_ORDERS,
  INITIAL_KOT_TICKETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_INVOICES,
} from "./mock-db";

export { DEFAULT_CAFE_SETTINGS, DEFAULT_TABLES };

const KEYS = {
  MENU: "cafe_pos_menu_v2",
  CUSTOMERS: "cafe_pos_customers_v1",
  COUPONS: "cafe_pos_coupons_v1",
  ORDERS: "cafe_pos_orders_v1",
  KOTS: "cafe_pos_kots_v1",
  LEDGER: "cafe_pos_ledger_v1",
  SETTINGS: "cafe_pos_settings_v1",
  NOTIFS: "cafe_pos_notifs_v1",
  INVOICES: "cafe_pos_invoices_v1",
};

// In-memory fallback
let memoryState = {
  menu: [...INITIAL_MENU_ITEMS],
  customers: [...INITIAL_CUSTOMERS],
  coupons: [...INITIAL_COUPONS],
  orders: [...INITIAL_SAMPLE_ORDERS],
  kots: [...INITIAL_KOT_TICKETS],
  ledger: [...INITIAL_POINTS_LEDGER],
  settings: { ...DEFAULT_CAFE_SETTINGS },
  notifs: [...INITIAL_NOTIFICATIONS],
  invoices: [...INITIAL_INVOICES],
};

function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getItem<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const val = localStorage.getItem(key);
    if (!val || val === "null" || val === "undefined") {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(val);
    // If it was supposed to be an array but parsed as empty array, reseed with fallback!
    if (Array.isArray(fallback) && Array.isArray(parsed) && parsed.length === 0 && fallback.length > 0) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return parsed as T;
  } catch (e) {
    console.warn(`Storage get error for ${key}:`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.warn(`Storage set error for ${key}:`, e);
  }
}

// ---------------- MENU ----------------
export function getMenuItems(): MenuItem[] {
  if (!isClient()) return memoryState.menu;
  const items = getItem<MenuItem[]>(KEYS.MENU, INITIAL_MENU_ITEMS);

  if (!items || !Array.isArray(items) || items.length === 0) {
    setItem(KEYS.MENU, INITIAL_MENU_ITEMS);
    return INITIAL_MENU_ITEMS;
  }

  // Ensure all items are 100% pure veg and have selectedForPOS set
  let changed = false;
  const normalized = items.map((it) => {
    let itemCopy = { ...it };
    if (!itemCopy.isVeg) {
      itemCopy.isVeg = true;
      changed = true;
    }
    if (itemCopy.name.toLowerCase().includes("chicken")) {
      itemCopy.name = "Smoked Paneer & Jalapeño Panini";
      itemCopy.description = "Tandoori smoked artisanal paneer, aged cheddar, spicy jalapeño remoulade on artisanal ciabatta.";
      itemCopy.isVeg = true;
      changed = true;
    }
    if (itemCopy.availableModifiers && itemCopy.availableModifiers.some((m) => m.name.toLowerCase().includes("egg"))) {
      itemCopy.availableModifiers = itemCopy.availableModifiers.map((m) =>
        m.name.toLowerCase().includes("egg") ? { ...m, name: "Extra Danish Feta" } : m
      );
      changed = true;
    }
    if (itemCopy.selectedForPOS === undefined) {
      itemCopy.selectedForPOS = true;
      changed = true;
    }
    return itemCopy;
  });

  if (changed) {
    setItem(KEYS.MENU, normalized);
  }

  return normalized;
}

// Returns only the items selected for the POS terminal
export function getPOSMenuItems(): MenuItem[] {
  const all = getMenuItems();
  const posItems = all.filter(
    (item) => item.selectedForPOS !== false && item.isAvailable !== false
  );
  // If somehow all items were deselected, fallback to all available items so cashier isn't stuck
  return posItems.length > 0 ? posItems : all;
}

export function saveMenuItem(item: MenuItem): MenuItem {
  const items = getMenuItems();
  const index = items.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item);
  }
  if (!isClient()) memoryState.menu = items;
  else setItem(KEYS.MENU, items);
  return item;
}

export function deleteMenuItem(id: string): MenuItem[] {
  const items = getMenuItems();
  const updated = items.filter((i) => i.id !== id);
  if (!isClient()) memoryState.menu = updated;
  else setItem(KEYS.MENU, updated);
  return updated;
}

export function toggleItemAvailability(id: string): MenuItem[] {
  const items = getMenuItems();
  const updated = items.map((it) =>
    it.id === id ? { ...it, isAvailable: !it.isAvailable } : it
  );
  if (!isClient()) memoryState.menu = updated;
  else setItem(KEYS.MENU, updated);
  return updated;
}

export function updateItemPOSSelection(id: string, selected: boolean): MenuItem[] {
  const items = getMenuItems();
  const updated = items.map((it) =>
    it.id === id ? { ...it, selectedForPOS: selected } : it
  );
  if (!isClient()) memoryState.menu = updated;
  else setItem(KEYS.MENU, updated);
  return updated;
}

export function bulkUpdatePOSSelection(ids: string[], selected: boolean): MenuItem[] {
  const idSet = new Set(ids);
  const items = getMenuItems();
  const updated = items.map((it) =>
    idSet.has(it.id) ? { ...it, selectedForPOS: selected } : it
  );
  if (!isClient()) memoryState.menu = updated;
  else setItem(KEYS.MENU, updated);
  return updated;
}

export function updateItemZomatoAvailability(id: string, available: boolean): MenuItem[] {
  const items = getMenuItems();
  const updated = items.map((it) =>
    it.id === id ? { ...it, availableOnZomato: available } : it
  );
  if (!isClient()) memoryState.menu = updated;
  else setItem(KEYS.MENU, updated);
  return updated;
}

export function importMenuItems(
  newItems: MenuItem[],
  mode: "merge" | "replace" = "merge"
): MenuItem[] {
  const current = getMenuItems();
  let result: MenuItem[];

  if (mode === "replace") {
    result = newItems.map((item, idx) => ({
      ...item,
      id: item.id || `imported-${Date.now()}-${idx}`,
      selectedForPOS: item.selectedForPOS !== undefined ? item.selectedForPOS : true,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
    }));
  } else {
    // Merge: update existing by id or name, append new
    const map = new Map<string, MenuItem>();
    current.forEach((item) => map.set(item.name.toLowerCase().trim(), item));

    newItems.forEach((item, idx) => {
      const key = item.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          ...item,
          id: existing.id,
          selectedForPOS: item.selectedForPOS !== undefined ? item.selectedForPOS : existing.selectedForPOS,
        });
      } else {
        const id = item.id || `imported-${Date.now()}-${idx}`;
        map.set(key, {
          ...item,
          id,
          selectedForPOS: item.selectedForPOS !== undefined ? item.selectedForPOS : true,
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        });
      }
    });

    result = Array.from(map.values());
  }

  if (!isClient()) memoryState.menu = result;
  else setItem(KEYS.MENU, result);
  return result;
}

// ---------------- CUSTOMERS ----------------
export function getCustomers(): Customer[] {
  if (!isClient()) return memoryState.customers;
  return getItem<Customer[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export function getCustomerByPhone(phone: string): Customer | undefined {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 5) return undefined;
  const customers = getCustomers();
  return customers.find((c) => {
    const cDigits = c.phone.replace(/\D/g, "");
    return cDigits === digits || (digits.length >= 10 && cDigits.endsWith(digits)) || (cDigits.length >= 10 && digits.endsWith(cDigits));
  });
}

export function updateCustomer(id: string, updates: Partial<Customer>): Customer {
  const customers = getCustomers();
  const existingIdx = customers.findIndex((c) => c.id === id);
  if (existingIdx < 0) {
    throw new Error("Customer not found");
  }
  const updated: Customer = {
    ...customers[existingIdx],
    ...updates,
  };
  customers[existingIdx] = updated;
  if (!isClient()) memoryState.customers = customers;
  else setItem(KEYS.CUSTOMERS, customers);
  return updated;
}

export function saveCustomer(
  customer: Omit<Customer, "id" | "pointsBalance" | "totalSpent" | "visitCount" | "createdAt"> & Partial<Customer>,
  allowOverwriteName: boolean = false
): Customer {
  const customers = getCustomers();
  const digits = customer.phone.replace(/\D/g, "");
  const existingIdx = customers.findIndex((c) => {
    const cDigits = c.phone.replace(/\D/g, "");
    return cDigits === digits || (digits.length >= 10 && cDigits.endsWith(digits)) || (cDigits.length >= 10 && digits.endsWith(cDigits));
  });

  if (existingIdx >= 0) {
    const existing = customers[existingIdx];
    const updated = {
      ...existing,
      ...customer,
      name: allowOverwriteName && customer.name && customer.name.trim() ? customer.name.trim() : existing.name,
    };
    customers[existingIdx] = updated;
    if (!isClient()) memoryState.customers = customers;
    else setItem(KEYS.CUSTOMERS, customers);
    return updated;
  } else {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      gstin: customer.gstin,
      address: customer.address,
      pointsBalance: customer.pointsBalance || 0,
      totalSpent: customer.totalSpent || 0,
      visitCount: customer.visitCount || 1,
      createdAt: new Date().toISOString(),
    };
    customers.unshift(newCust);
    if (!isClient()) memoryState.customers = customers;
    else setItem(KEYS.CUSTOMERS, customers);
    return newCust;
  }
}

// ---------------- POINTS LEDGER ----------------
export function getPointsLedger(customerId?: string): PointsLedgerEntry[] {
  const ledger = isClient()
    ? getItem<PointsLedgerEntry[]>(KEYS.LEDGER, INITIAL_POINTS_LEDGER)
    : memoryState.ledger;

  if (customerId) {
    return ledger.filter((l) => l.customerId === customerId);
  }
  return ledger;
}

export function addLedgerEntry(entry: Omit<PointsLedgerEntry, "id" | "createdAt">): PointsLedgerEntry {
  const ledger = isClient()
    ? getItem<PointsLedgerEntry[]>(KEYS.LEDGER, INITIAL_POINTS_LEDGER)
    : memoryState.ledger;

  const newEntry: PointsLedgerEntry = {
    ...entry,
    id: `ledg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...ledger];
  if (!isClient()) memoryState.ledger = updated;
  else setItem(KEYS.LEDGER, updated);
  return newEntry;
}

// ---------------- COUPONS ----------------
export function getCoupons(): Coupon[] {
  if (!isClient()) return memoryState.coupons;
  return getItem<Coupon[]>(KEYS.COUPONS, INITIAL_COUPONS);
}

export function getCouponByCode(code: string): Coupon | undefined {
  const coupons = getCoupons();
  return coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
}

export function saveCoupon(coupon: Coupon): void {
  const coupons = getCoupons();
  const idx = coupons.findIndex((c) => c.id === coupon.id || c.code.toUpperCase() === coupon.code.toUpperCase());
  if (idx >= 0) {
    coupons[idx] = coupon;
  } else {
    coupons.unshift(coupon);
  }
  if (!isClient()) memoryState.coupons = coupons;
  else setItem(KEYS.COUPONS, coupons);
}

export function toggleCoupon(id: string): Coupon[] {
  const coupons = getCoupons();
  const updated = coupons.map((c) =>
    c.id === id ? { ...c, isActive: !c.isActive } : c
  );
  if (!isClient()) memoryState.coupons = updated;
  else setItem(KEYS.COUPONS, updated);
  return updated;
}

// ---------------- ORDERS & KOT ----------------
export function getOrders(): Order[] {
  if (!isClient()) return memoryState.orders;
  return getItem<Order[]>(KEYS.ORDERS, INITIAL_SAMPLE_ORDERS);
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find((o) => o.id === id || o.orderNumber === id);
}

export function getKOTTickets(): KOTTicket[] {
  if (!isClient()) return memoryState.kots;
  return getItem<KOTTicket[]>(KEYS.KOTS, INITIAL_KOT_TICKETS);
}

export function updateKOTStatus(kotId: string, status: KOTStatus): KOTTicket[] {
  const kots = getKOTTickets();
  const now = new Date().toISOString();
  const updated = kots.map((ticket) => {
    if (ticket.id === kotId || ticket.kotNumber === kotId) {
      return {
        ...ticket,
        status,
        startedAt: status === "PREPARING" && !ticket.startedAt ? now : ticket.startedAt,
        readyAt: status === "READY" && !ticket.readyAt ? now : ticket.readyAt,
        completedAt: status === "COMPLETED" ? now : ticket.completedAt,
      };
    }
    return ticket;
  });

  if (!isClient()) memoryState.kots = updated;
  else setItem(KEYS.KOTS, updated);
  return updated;
}

export function updateAllKOTStatus(fromStatus: KOTStatus, toStatus: KOTStatus): KOTTicket[] {
  const kots = getKOTTickets();
  const now = new Date().toISOString();
  const updated = kots.map((ticket) => {
    if (ticket.status === fromStatus) {
      return {
        ...ticket,
        status: toStatus,
        startedAt: toStatus === "PREPARING" && !ticket.startedAt ? now : ticket.startedAt,
        readyAt: toStatus === "READY" && !ticket.readyAt ? now : ticket.readyAt,
        completedAt: toStatus === "COMPLETED" ? now : ticket.completedAt,
      };
    }
    return ticket;
  });

  if (!isClient()) memoryState.kots = updated;
  else setItem(KEYS.KOTS, updated);
  return updated;
}

export function deleteOrder(id: string): Order[] {
  const orders = getOrders();
  const updated = orders.filter((o) => o.id !== id && o.orderNumber !== id);
  if (!isClient()) memoryState.orders = updated;
  else setItem(KEYS.ORDERS, updated);
  return updated;
}

export function getZomatoOrders(): Order[] {
  const orders = getOrders();
  return orders.filter(
    (o) =>
      o.isZomatoOrder ??
      (o.orderType === "DELIVERY" || o.paymentMethod === "ZOMATO" || !!o.zomatoOrderId)
  );
}

export function getInStoreOrders(): Order[] {
  const orders = getOrders();
  return orders.filter(
    (o) =>
      !(
        o.isZomatoOrder ??
        (o.orderType === "DELIVERY" || o.paymentMethod === "ZOMATO" || !!o.zomatoOrderId)
      )
  );
}

export function getSalesSummary(): SalesSummary {
  const orders = getOrders();
  const invoices = getCustomInvoices();

  const paidInStoreOrders = orders.filter(
    (o) =>
      (o.paymentStatus === "PAID" || !o.paymentStatus) &&
      !(
        o.isZomatoOrder ??
        (o.orderType === "DELIVERY" || o.paymentMethod === "ZOMATO" || !!o.zomatoOrderId)
      )
  );
  const inStoreSales = paidInStoreOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);

  const paidZomatoOrders = orders.filter(
    (o) =>
      (o.paymentStatus === "PAID" || !o.paymentStatus) &&
      Boolean(
        o.isZomatoOrder ??
        (o.orderType === "DELIVERY" || o.paymentMethod === "ZOMATO" || !!o.zomatoOrderId)
      )
  );
  const zomatoEarnings = paidZomatoOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);

  const paidInvoices = invoices.filter((i) => i.paymentStatus === "PAID");
  const b2bInvoiced = paidInvoices.reduce((sum, i) => sum + (i.finalTotal || 0), 0);

  return {
    inStoreSales,
    inStoreOrderCount: paidInStoreOrders.length,
    zomatoEarnings,
    zomatoOrderCount: paidZomatoOrders.length,
    b2bInvoiced,
    b2bInvoiceCount: paidInvoices.length,
    grossCombinedTotal: inStoreSales + zomatoEarnings + b2bInvoiced,
    totalTransactions: paidInStoreOrders.length + paidZomatoOrders.length + paidInvoices.length,
  };
}

export interface CreateOrderParams {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  pointsRedeemed: number;
  pointsDiscount: number;
  finalTotal: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus; // "PAID" for instant checkout, "PENDING" for order first / pay later
  orderType: OrderType;
  tableNumber?: string;
  isZomatoOrder?: boolean;
  zomatoOrderId?: string;
  notes?: string;
  items: OrderItemSnapshot[];
}

export interface OrderCreationResult {
  order: Order;
  kot: KOTTicket;
  customer?: Customer;
}

export function createOrderAndKOT(params: CreateOrderParams): OrderCreationResult {
  const orders = getOrders();
  const kots = getKOTTickets();
  const customers = getCustomers();

  const nextOrderNum = 1040 + orders.length + 1;
  const nextKotNum = 86 + kots.length + 1;

  const orderId = `ord-${Date.now()}`;
  const orderNumber = `ORD-${nextOrderNum}`;
  const kotNumber = `KOT-${nextKotNum}`;
  const now = new Date().toISOString();
  const paymentStatus: PaymentStatus = params.paymentStatus || "PAID";
  const isPaid = paymentStatus === "PAID";

  const isZomato = Boolean(
    params.isZomatoOrder ??
    (params.orderType === "DELIVERY" || params.paymentMethod === "ZOMATO" || Boolean(params.zomatoOrderId))
  );

  // If Zomato order, append identifier to notes for clear store record
  let combinedNotes = params.notes || "";
  if (params.orderType === "DELIVERY" && params.zomatoOrderId) {
    const zomatoTag = `[Zomato Order: #${params.zomatoOrderId}]`;
    combinedNotes = combinedNotes ? `${zomatoTag} ${combinedNotes}` : zomatoTag;
  }

  // 1. Create Order
  const newOrder: Order = {
    id: orderId,
    orderNumber,
    kotNumber,
    customerId: params.customerId,
    customerName: params.customerName || (params.orderType === "DELIVERY" ? "Zomato Customer" : undefined),
    customerPhone: params.customerPhone,
    subtotal: params.subtotal,
    cgst: params.cgst,
    sgst: params.sgst,
    taxAmount: params.taxAmount,
    discountAmount: params.discountAmount,
    couponCode: params.couponCode,
    pointsRedeemed: isPaid ? params.pointsRedeemed : 0,
    pointsDiscount: isPaid ? params.pointsDiscount : 0,
    finalTotal: params.finalTotal,
    pointsEarned: isPaid ? params.pointsEarned : 0,
    paymentMethod: params.paymentMethod,
    paymentStatus,
    orderType: params.orderType,
    tableNumber: params.tableNumber,
    isZomatoOrder: isZomato,
    zomatoOrderId: params.zomatoOrderId,
    notes: combinedNotes || undefined,
    items: params.items,
    createdAt: now,
  };

  // 2. Create KOT Ticket
  const prepNotesSummary = [
    combinedNotes,
    ...params.items
      .filter((i) => i.notes)
      .map((i) => `${i.name}: ${i.notes}`),
  ]
    .filter(Boolean)
    .join("; ");

  const newKot: KOTTicket = {
    id: `kot-${Date.now()}`,
    kotNumber,
    orderId,
    orderNumber,
    orderType: params.orderType,
    tableNumber: params.tableNumber,
    status: "ACTIVE",
    preparationNotes: prepNotesSummary || undefined,
    items: params.items,
    createdAt: now,
  };

  // 3. Update Customer loyalty ONLY IF paid immediately (otherwise settled at the end)
  let updatedCustomer: Customer | undefined = undefined;
  if (isPaid && (params.customerId || params.customerPhone)) {
    let cust = params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : undefined;

    if (!cust && params.customerPhone) {
      cust = getCustomerByPhone(params.customerPhone);
    }

    if (cust) {
      const startBalance = cust.pointsBalance;
      let newBalance = startBalance;

      if (params.pointsRedeemed > 0) {
        newBalance -= params.pointsRedeemed;
        addLedgerEntry({
          customerId: cust.id,
          orderId,
          pointsChange: -params.pointsRedeemed,
          reason: `Redeemed on Order #${orderNumber}`,
          balanceAfter: newBalance,
        });
      }

      if (params.pointsEarned > 0) {
        newBalance += params.pointsEarned;
        addLedgerEntry({
          customerId: cust.id,
          orderId,
          pointsChange: params.pointsEarned,
          reason: `Earned on Order #${orderNumber}`,
          balanceAfter: newBalance,
        });
      }

      cust.pointsBalance = Math.max(0, newBalance);
      cust.totalSpent += params.finalTotal;
      cust.visitCount += 1;
      updatedCustomer = { ...cust };

      if (!isClient()) memoryState.customers = customers;
      else setItem(KEYS.CUSTOMERS, customers);
    }
  }

  // 4. Update coupon usage ONLY IF paid immediately
  if (isPaid && params.couponCode) {
    const coupons = getCoupons();
    const coup = coupons.find(
      (c) => c.code.toUpperCase() === params.couponCode?.toUpperCase()
    );
    if (coup) {
      coup.timesUsed += 1;
      if (!isClient()) memoryState.coupons = coupons;
      else setItem(KEYS.COUPONS, coupons);
    }
  }

  // 5. Persist
  const updatedOrders = [newOrder, ...orders];
  const updatedKots = [newKot, ...kots];

  if (!isClient()) {
    memoryState.orders = updatedOrders;
    memoryState.kots = updatedKots;
  } else {
    setItem(KEYS.ORDERS, updatedOrders);
    setItem(KEYS.KOTS, updatedKots);
  }

  return { order: newOrder, kot: newKot, customer: updatedCustomer };
}

// ---------------- RUNNING ORDERS & TABLE WORKFLOW ----------------

// Returns all active running orders that have not been settled/paid yet
export function getRunningOrders(): Order[] {
  const orders = getOrders();
  return orders.filter((o) => o.paymentStatus === "PENDING");
}

// Find open order by table number
export function getRunningOrderByTable(tableNumber: string): Order | undefined {
  const running = getRunningOrders();
  return running.find((o) => o.tableNumber === tableNumber);
}

// Cashier adds additional items to an existing running order (Table Tab)
// Generates an Incremental KOT ticket for the kitchen with ONLY the newly added items!
export function addItemsToRunningOrder(params: {
  orderId: string;
  newItems: OrderItemSnapshot[];
  subtotalDelta: number;
  cgstDelta: number;
  sgstDelta: number;
  taxDelta: number;
  finalTotalDelta: number;
  notes?: string;
}): { order: Order; kot: KOTTicket } | null {
  const orders = getOrders();
  const kots = getKOTTickets();
  const orderIdx = orders.findIndex((o) => o.id === params.orderId);
  if (orderIdx < 0) return null;

  const order = orders[orderIdx];
  const nextKotNum = 86 + kots.length + 1;
  const kotNumber = `KOT-${nextKotNum}`;
  const now = new Date().toISOString();

  // Create Incremental KOT ticket for kitchen with ONLY newly added items
  const prepNotesSummary = [
    params.notes,
    ...params.newItems.filter((i) => i.notes).map((i) => `${i.name}: ${i.notes}`),
  ]
    .filter(Boolean)
    .join("; ");

  const newKot: KOTTicket = {
    id: `kot-${Date.now()}`,
    kotNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    status: "ACTIVE",
    preparationNotes: prepNotesSummary
      ? `[INCREMENTAL ADD-ON] ${prepNotesSummary}`
      : "[INCREMENTAL ADD-ON ROUND]",
    items: params.newItems,
    createdAt: now,
  };

  // Merge items into running order
  const mergedItems = [...order.items, ...params.newItems];
  const updatedOrder: Order = {
    ...order,
    items: mergedItems,
    subtotal: order.subtotal + params.subtotalDelta,
    cgst: order.cgst + params.cgstDelta,
    sgst: order.sgst + params.sgstDelta,
    taxAmount: order.taxAmount + params.taxDelta,
    finalTotal: order.finalTotal + params.finalTotalDelta,
    notes: params.notes
      ? order.notes
        ? `${order.notes} | ${params.notes}`
        : params.notes
      : order.notes,
  };

  orders[orderIdx] = updatedOrder;
  const updatedKots = [newKot, ...kots];

  if (!isClient()) {
    memoryState.orders = orders;
    memoryState.kots = updatedKots;
  } else {
    setItem(KEYS.ORDERS, orders);
    setItem(KEYS.KOTS, updatedKots);
  }

  return { order: updatedOrder, kot: newKot };
}

// Settle running order at the end: marks PAID, applies final coupon & loyalty points, updates payment method
export function settleRunningOrder(params: {
  orderId: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  cgst: number;
  sgst: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  pointsRedeemed: number;
  pointsDiscount: number;
  finalTotal: number;
  pointsEarned: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}): { order: Order; customer?: Customer } | null {
  const orders = getOrders();
  const customers = getCustomers();
  const orderIdx = orders.findIndex((o) => o.id === params.orderId);
  if (orderIdx < 0) return null;

  const order = orders[orderIdx];

  // Loyalty Points update on settlement
  let updatedCustomer: Customer | undefined = undefined;
  if (params.customerId || params.customerPhone) {
    let cust = params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : undefined;

    if (!cust && params.customerPhone) {
      cust = getCustomerByPhone(params.customerPhone);
    }

    if (cust) {
      let newBalance = cust.pointsBalance;
      if (params.pointsRedeemed > 0) {
        newBalance -= params.pointsRedeemed;
        addLedgerEntry({
          customerId: cust.id,
          orderId: order.id,
          pointsChange: -params.pointsRedeemed,
          reason: `Redeemed on Order #${order.orderNumber}`,
          balanceAfter: newBalance,
        });
      }

      if (params.pointsEarned > 0) {
        newBalance += params.pointsEarned;
        addLedgerEntry({
          customerId: cust.id,
          orderId: order.id,
          pointsChange: params.pointsEarned,
          reason: `Earned on Order #${order.orderNumber}`,
          balanceAfter: newBalance,
        });
      }

      cust.pointsBalance = Math.max(0, newBalance);
      cust.totalSpent += params.finalTotal;
      cust.visitCount += 1;
      updatedCustomer = { ...cust };

      if (!isClient()) memoryState.customers = customers;
      else setItem(KEYS.CUSTOMERS, customers);
    }
  }

  // Update coupon usage
  if (params.couponCode) {
    const coupons = getCoupons();
    const coup = coupons.find(
      (c) => c.code.toUpperCase() === params.couponCode?.toUpperCase()
    );
    if (coup) {
      coup.timesUsed += 1;
      if (!isClient()) memoryState.coupons = coupons;
      else setItem(KEYS.COUPONS, coupons);
    }
  }

  const settledOrder: Order = {
    ...order,
    paymentStatus: "PAID",
    paymentMethod: params.paymentMethod,
    subtotal: params.subtotal,
    cgst: params.cgst,
    sgst: params.sgst,
    taxAmount: params.taxAmount,
    discountAmount: params.discountAmount,
    couponCode: params.couponCode,
    pointsRedeemed: params.pointsRedeemed,
    pointsDiscount: params.pointsDiscount,
    finalTotal: params.finalTotal,
    pointsEarned: params.pointsEarned,
    customerId: params.customerId || order.customerId,
    customerName: params.customerName || order.customerName,
    customerPhone: params.customerPhone || order.customerPhone,
  };

  orders[orderIdx] = settledOrder;
  if (!isClient()) memoryState.orders = orders;
  else setItem(KEYS.ORDERS, orders);

  return { order: settledOrder, customer: updatedCustomer };
}

// Cancel or void an unpaid running order
export function cancelRunningOrder(orderId: string): boolean {
  const orders = getOrders();
  const updated = orders.filter((o) => o.id !== orderId);
  if (!isClient()) memoryState.orders = updated;
  else setItem(KEYS.ORDERS, updated);
  return true;
}

// Transfer/shift an active running order from one table to another
export function transferRunningOrderTable(orderId: string, newTable: string): Order | null {
  const orders = getOrders();
  const kots = getKOTTickets();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx < 0) return null;

  const order = orders[orderIdx];
  const updatedOrder: Order = {
    ...order,
    tableNumber: newTable,
    orderType: "DINE_IN",
  };
  orders[orderIdx] = updatedOrder;

  // Also update tableNumber on any KOT tickets associated with this order
  const updatedKots = kots.map((k) =>
    k.orderId === orderId ? { ...k, tableNumber: newTable } : k
  );

  if (!isClient()) {
    memoryState.orders = orders;
    memoryState.kots = updatedKots;
  } else {
    setItem(KEYS.ORDERS, orders);
    setItem(KEYS.KOTS, updatedKots);
  }

  return updatedOrder;
}

// Update quantity or remove an already-sent item in an active running order
export function updateRunningOrderItemQuantity(
  orderId: string,
  itemIndex: number,
  delta: number,
  taxRatePercent: number = 5
): Order | null {
  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx < 0) return null;

  const order = orders[orderIdx];
  const items = [...order.items];
  const item = items[itemIndex];
  if (!item) return null;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    items.splice(itemIndex, 1);
  } else {
    items[itemIndex] = {
      ...item,
      quantity: newQty,
      subtotal: item.unitPrice * newQty,
    };
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const taxAmount = (subtotal * taxRatePercent) / 100;
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const finalTotal = subtotal + taxAmount;

  const updatedOrder: Order = {
    ...order,
    items,
    subtotal,
    cgst,
    sgst,
    taxAmount,
    finalTotal,
  };

  orders[orderIdx] = updatedOrder;
  if (!isClient()) memoryState.orders = orders;
  else setItem(KEYS.ORDERS, orders);

  return updatedOrder;
}

// Remove an already-sent item from an active running order
export function removeRunningOrderItem(
  orderId: string,
  itemIndex: number,
  taxRatePercent: number = 5
): Order | null {
  return updateRunningOrderItemQuantity(orderId, itemIndex, -999999, taxRatePercent);
}

// ---------------- DEDICATED CUSTOM INVOICES ----------------
export function getCustomInvoices(): CustomInvoice[] {
  if (!isClient()) return memoryState.invoices;
  return getItem<CustomInvoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
}

export function getCustomInvoiceById(id: string): CustomInvoice | undefined {
  const invoices = getCustomInvoices();
  return invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
}

export function saveCustomInvoice(invoice: CustomInvoice): CustomInvoice {
  const invoices = getCustomInvoices();
  const idx = invoices.findIndex((i) => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
  if (idx >= 0) {
    invoices[idx] = invoice;
  } else {
    invoices.unshift(invoice);
  }
  if (!isClient()) memoryState.invoices = invoices;
  else setItem(KEYS.INVOICES, invoices);
  return invoice;
}

export function deleteCustomInvoice(id: string): CustomInvoice[] {
  const invoices = getCustomInvoices();
  const updated = invoices.filter((i) => i.id !== id);
  if (!isClient()) memoryState.invoices = updated;
  else setItem(KEYS.INVOICES, updated);
  return updated;
}

// ---------------- NOTIFICATIONS ----------------
export function getNotificationLogs(): NotificationLog[] {
  if (!isClient()) return memoryState.notifs;
  return getItem<NotificationLog[]>(KEYS.NOTIFS, INITIAL_NOTIFICATIONS);
}

export function addNotificationLog(log: Omit<NotificationLog, "id" | "timestamp">): NotificationLog {
  const notifs = getNotificationLogs();
  const newNotif: NotificationLog = {
    ...log,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newNotif, ...notifs];
  if (!isClient()) memoryState.notifs = updated;
  else setItem(KEYS.NOTIFS, updated);
  return newNotif;
}

export function getSettings(): CafeSettings {
  if (!isClient()) return memoryState.settings;
  const s = getItem<CafeSettings>(KEYS.SETTINGS, DEFAULT_CAFE_SETTINGS);
  if (s && (s.cafeName === "The Roast & Crumb" || !s.cafeName)) {
    const updated: CafeSettings = {
      ...s,
      cafeName: "Chandni Chowk Cheese Cafe",
      tagline: s.tagline === "Specialty Roastery & Artisan Bakehouse" ? "Heritage Flavours & Artisan Melts" : (s.tagline || "Heritage Flavours & Artisan Melts"),
      upiPayeeName: s.upiPayeeName === "The Roast & Crumb Cafe" ? "Chandni Chowk Cheese Cafe" : (s.upiPayeeName || "Chandni Chowk Cheese Cafe"),
      email: s.email === "hello@roastandcrumb.in" ? "hello@chandnichowkcheese.in" : (s.email || "hello@chandnichowkcheese.in"),
      wifiSsid: s.wifiSsid === "RoastCrumb_Guest" ? "ChandniChowkCheese_Guest" : (s.wifiSsid || "ChandniChowkCheese_Guest"),
      upiId: s.upiId === "roastandcrumb@hdfcbank" ? "chandnichowkcheese@hdfcbank" : (s.upiId || "chandnichowkcheese@hdfcbank"),
      termsAndConditions: s.termsAndConditions?.includes("roastandcrumb.in")
        ? s.termsAndConditions.replace(/roastandcrumb\.in/g, "chandnichowkcheese.in")
        : s.termsAndConditions,
    };
    setItem(KEYS.SETTINGS, updated);
    return updated;
  }
  return s;
}

export function saveSettings(settings: CafeSettings): void {
  if (!isClient()) memoryState.settings = settings;
  else setItem(KEYS.SETTINGS, settings);
}

// ---------------- TABLES MANAGEMENT ----------------
export function getTables(): string[] {
  const settings = getSettings();
  if (settings.customTables && Array.isArray(settings.customTables) && settings.customTables.length > 0) {
    return settings.customTables;
  }
  const count = settings.tableCount || 12;
  return Array.from({ length: count }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`);
}

export function saveTables(tables: string[]): void {
  const current = getSettings();
  const updated: CafeSettings = {
    ...current,
    customTables: tables,
    tableCount: tables.length,
  };
  saveSettings(updated);
}

export function setTableCount(count: number): string[] {
  const safeCount = Math.max(1, Math.min(60, count));
  const newTables = Array.from({ length: safeCount }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`);
  saveTables(newTables);
  return newTables;
}

export function addSingleTable(name?: string): string[] {
  const current = getTables();
  let nextName = name?.trim();
  if (!nextName) {
    const numbers = current
      .map((t) => {
        const m = t.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : current.length;
    nextName = `T-${String(maxNum + 1).padStart(2, "0")}`;
  }
  if (!current.includes(nextName)) {
    const updated = [...current, nextName];
    saveTables(updated);
    return updated;
  }
  return current;
}

export function removeSingleTable(tableName: string): string[] {
  const current = getTables();
  if (current.length <= 1) return current;
  const updated = current.filter((t) => t !== tableName);
  saveTables(updated);
  return updated;
}


// ---------------- RESET TO DEFAULTS ----------------
export function resetToDefaults(): void {
  if (!isClient()) {
    memoryState = {
      menu: [...INITIAL_MENU_ITEMS],
      customers: [...INITIAL_CUSTOMERS],
      coupons: [...INITIAL_COUPONS],
      orders: [...INITIAL_SAMPLE_ORDERS],
      kots: [...INITIAL_KOT_TICKETS],
      ledger: [...INITIAL_POINTS_LEDGER],
      settings: { ...DEFAULT_CAFE_SETTINGS },
      notifs: [...INITIAL_NOTIFICATIONS],
      invoices: [...INITIAL_INVOICES],
    };
    return;
  }

  localStorage.setItem(KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_SAMPLE_ORDERS));
  localStorage.setItem(KEYS.KOTS, JSON.stringify(INITIAL_KOT_TICKETS));
  localStorage.setItem(KEYS.LEDGER, JSON.stringify(INITIAL_POINTS_LEDGER));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_CAFE_SETTINGS));
  localStorage.setItem(KEYS.NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
}

// ---------------- BACKUP & EXPORT ----------------
export function getAllStoreDataJSON(): string {
  const data = {
    settings: getSettings(),
    menu: getMenuItems(),
    customers: getCustomers(),
    coupons: getCoupons(),
    orders: getOrders(),
    kots: getKOTTickets(),
    ledger: getPointsLedger(),
    invoices: getCustomInvoices(),
    exportedAt: new Date().toISOString(),
    version: "2.0",
  };
  return JSON.stringify(data, null, 2);
}
