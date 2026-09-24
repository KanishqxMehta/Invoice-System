export type CategoryType = 
  | "All"
  | "Espresso"
  | "Cold Brews"
  | "Teas"
  | "Pastries"
  | "Sandwiches"
  | "Add-ons"
  | string;

export interface PortionVariant {
  id: string;
  name: string; // e.g. "Half Plate", "Full Plate", "Regular", "Large"
  price: number; // in INR (In-Store Price)
  zomatoPrice?: number; // in INR (Optional Zomato-specific price)
}

export interface ItemModifier {
  id: string;
  name: string;
  price: number; // in INR
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number; // in INR (single price or base in-store price)
  zomatoPrice?: number; // in INR (Zomato-specific price; defaults to in-store price if omitted)
  hasPortions?: boolean; // True if item offers portions like Half Plate / Full Plate
  portions?: PortionVariant[]; // e.g. [{ id: "p-half", name: "Half Plate", price: 140, zomatoPrice: 170 }, ...]
  isVeg: boolean;
  description: string;
  image?: string;
  isAvailable: boolean; // In Stock / Out of Stock
  selectedForPOS: boolean; // Active & selectable in Cashier POS terminal
  availableOnZomato?: boolean; // Active & orderable via Zomato Delivery (defaults to true)
  availableModifiers: ItemModifier[];
}

export interface CartModifier {
  name: string;
  price: number;
}

export interface CartItem {
  lineId: string; // unique ID for cart row (item + portion + selected modifiers)
  itemId: string;
  name: string;
  portionName?: string; // e.g. "Half Plate" or "Full Plate"
  basePrice: number;
  quantity: number;
  isVeg: boolean;
  modifiers: CartModifier[];
  notes?: string;
  unitTotal: number; // basePrice + modifiers total
  itemTotal: number; // unitTotal * quantity
}

export type PaymentMethod = "UPI_QR" | "CASH" | "CARD" | "BANK_TRANSFER" | "ZOMATO";
export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "OVERDUE";
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "CATERING" | "B2B_EVENT";
export type KOTStatus = "ACTIVE" | "PREPARING" | "READY" | "COMPLETED";

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  gstin?: string;
  address?: string;
  pointsBalance: number;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
}

export interface PointsLedgerEntry {
  id: string;
  customerId: string;
  orderId?: string;
  pointsChange: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

export type DiscountType = "PERCENT" | "FLAT";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number; // e.g. 10 for 10% or 50 for ₹50 flat
  minOrder: number;
  maxDiscount?: number; // Cap for percent discounts
  expiryDate?: string;
  isActive: boolean;
  timesUsed: number;
  description: string;
}

export interface OrderItemSnapshot {
  id: string;
  name: string;
  portionName?: string; // e.g. "Half Plate", "Full Plate", "Regular", "Large"
  quantity: number;
  unitPrice: number;
  modifiers: CartModifier[];
  notes?: string;
  subtotal: number;
  isVeg: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-1042"
  kotNumber: string;   // e.g. "KOT-89"
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  cgst: number; // 2.5%
  sgst: number; // 2.5%
  taxAmount: number; // 5% total
  discountAmount: number;
  couponCode?: string;
  pointsRedeemed: number;
  pointsDiscount: number;
  finalTotal: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  tableNumber?: string;
  isZomatoOrder?: boolean; // Explicit flag distinguishing Zomato Delivery vs Cafe In-Store
  zomatoOrderId?: string;
  cafeId?: string; // Multi-tenant branch identifier
  notes?: string;
  items: OrderItemSnapshot[];
  createdAt: string;
}

export interface SalesSummary {
  inStoreSales: number;
  inStoreOrderCount: number;
  zomatoEarnings: number;
  zomatoOrderCount: number;
  b2bInvoiced: number;
  b2bInvoiceCount: number;
  grossCombinedTotal: number;
  totalTransactions: number;
}

export interface KOTTicket {
  id: string;
  kotNumber: string;
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  status: KOTStatus;
  cafeId?: string;
  preparationNotes?: string;
  items: OrderItemSnapshot[];
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  completedAt?: string;
}

export interface NotificationLog {
  id: string;
  orderId: string;
  orderNumber: string;
  recipientPhone: string;
  customerName: string;
  channel: "WHATSAPP" | "SMS";
  status: "SENT" | "FAILED" | "QUEUED";
  statusCode: number;
  messagePayload: string;
  billUrl: string;
  timestamp: string;
}

export interface CafeSettings {
  cafeName: string;
  tagline: string;
  address: string;
  phone: string;
  email?: string;
  gstNumber: string;
  fssaiNumber: string;
  wifiSsid: string;
  wifiPass: string;
  currencySymbol: string;
  taxRatePercent: number; // Default 5%
  cgstRatePercent: number; // 2.5%
  sgstRatePercent: number; // 2.5%
  pointRedeemRateInr: number; // 1 point = ₹1.00
  pointEarnRateRatio: number; // 1 point per ₹20 spent
  loyaltyEarnMode?: "PERCENTAGE" | "SPEND_RATIO"; // Default "PERCENTAGE"
  loyaltyEarnPercent?: number; // e.g. 5 means 5% of order total awarded as points
  welcomeBonusPoints?: number; // Default 50 bonus points on registration
  upiId: string;
  upiPayeeName: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  termsAndConditions?: string;
  showNavbarClock?: boolean;
  tableCount?: number; // Total number of dining tables (default 12)
  customTables?: string[]; // Optional custom table identifiers (e.g. ["T-01", "Outdoor-1"])
  cafeId?: string;
}

// ---------------- DEDICATED INVOICE SPECIFICATION ----------------
export interface InvoiceLineItem {
  id: string;
  itemId?: string;
  name: string;
  portionName?: string; // e.g. "Half Plate", "Full Plate"
  description?: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // in INR
  gstRate: number; // 0, 5, 12, 18 %
  taxableAmount: number;
  cgst: number;
  sgst: number;
  total: number;
}

export type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";

export interface CustomInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-001"
  date: string;
  dueDate?: string;
  invoiceType: "TAX_INVOICE" | "CATERING" | "B2B_SUPPLY" | "PROFORMA";
  
  // Client Details
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstin?: string;
  customerAddress?: string;
  placeOfSupply?: string;

  // Financial Breakdown
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  roundOff: number;
  finalTotal: number;

  // Payment
  paymentStatus: InvoiceStatus;
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  paymentRef?: string;

  // Terms & Notes
  notes?: string;
  terms?: string;
  cafeId?: string;
  createdAt: string;
}

// ---------------- MULTI-CAFE LOGIN & BRANCH TYPES ----------------
export interface CafeLocation {
  addressLine: string; // e.g. "Shop 48, Near Town Hall, Chandni Chowk"
  landmark?: string;   // e.g. "Opp. Gurudwara Sis Ganj"
  city: string;        // e.g. "Delhi", "Bengaluru"
  state: string;       // e.g. "Delhi", "Karnataka"
  pincode: string;     // e.g. "110006"
}

export type UserRole = "SUPER_ADMIN" | "CAFE_MANAGER" | "CASHIER";

export type CafeStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface CafeAccount {
  id: string; // unique ID e.g. "cafe-delhi-flagship", "cafe-cp-02"
  username: string; // e.g. "admin", "chandni_cp"
  password: string; // password
  pin?: string; // 4-digit quick POS cashier PIN
  role: UserRole;
  
  // Cafe & Branch Details
  cafeName: string;
  branchCode: string; // e.g. "CC-DEL-01", "CC-CP-02"
  tagline?: string;
  
  // Detailed Location
  location: CafeLocation;
  
  // Management & Contact Details
  managerName: string;
  contactPhone: string;
  contactEmail: string;
  
  // Compliance & Operations
  gstin: string;
  fssaiNumber: string;
  tableCount: number;
  seatingCapacity: number;
  upiId: string;
  upiPayeeName: string;
  status: CafeStatus;
  openingHours?: string;
  
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: CafeAccount;
  activeCafeId: string; // If SUPER_ADMIN, which cafe is currently viewed/selected, or "ALL_CAFES"
  token: string;
  loginAt: string;
}

