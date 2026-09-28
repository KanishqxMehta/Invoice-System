import { Order, Customer, CafeSettings, NotificationLog } from "./types";
import { addNotificationLog } from "./storage";
import { formatINR } from "./calculator";

export interface SendWhatsAppReceiptParams {
  order: Order;
  customer?: Customer | null;
  settings: CafeSettings;
  baseUrl?: string;
  phoneOverride?: string;
}

/**
 * Resolves the application base URL, prioritizing configured NEXT_PUBLIC_APP_URL
 */
export function getAppBaseUrl(overrideBaseUrl?: string): string {
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_APP_URL.trim() !== "" &&
    process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000"
  ) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (overrideBaseUrl && overrideBaseUrl.trim() !== "") {
    return overrideBaseUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Normalizes any entered phone number into standard international format for wa.me/ links
 * e.g., "9876543210" -> "919876543210", "+91 98765-43210" -> "919876543210"
 */
export function normalizeWhatsAppPhone(
  phone: string | undefined | null,
  defaultCountryCode = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "91"
): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // If entered with leading 0 (e.g. 09876543210 in India), strip the 0
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If 10 digits without country code, prepend default country code (91)
  const cleanCountryCode = defaultCountryCode.replace(/\D/g, "") || "91";
  if (digits.length === 10) {
    digits = cleanCountryCode + digits;
  }

  return digits;
}

function formatOrderType(type: string): string {
  switch (type) {
    case "DINE_IN":
      return "Dine-In";
    case "TAKEAWAY":
      return "Takeaway";
    case "DELIVERY":
      return "Delivery";
    default:
      return type;
  }
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case "UPI_QR":
      return "UPI";
    case "CASH":
      return "Cash";
    case "CARD":
      return "Card";
    case "ZOMATO":
      return "Zomato";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    default:
      return method.replace(/_/g, " ");
  }
}

/**
 * Generates formatted WhatsApp text message for the receipt
 */
export function formatWhatsAppReceiptText(params: {
  order: Order;
  customer?: Customer | null;
  settings: CafeSettings;
  baseUrl?: string;
}): string {
  const { order, customer, settings, baseUrl = "" } = params;
  const effectiveBaseUrl = getAppBaseUrl(baseUrl);
  const customerName =
    order.customerName || customer?.name || "Valued Guest";
  const billUrl = `${effectiveBaseUrl}/bill/${order.id}`;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsList = order.items.map((item) => {
    const portion = item.portionName ? ` (${item.portionName})` : "";
    const price = formatINR(item.subtotal || item.unitPrice * item.quantity);
    return `• ${item.quantity} × ${item.name}${portion} — ${price}`;
  });

  // Header Section
  const headerLines: string[] = [
    `☕ *${(settings.cafeName || "CAFE").toUpperCase()}*`,
  ];
  if (settings.tagline) {
    headerLines.push(`_${settings.tagline}_`);
  }
  headerLines.push(`━━━━━━━━━━━━━━━━━━━━`);
  headerLines.push(`Hi *${customerName}*! Thank you for dining with us.`);

  // Invoice Meta Section
  const metaLines: string[] = [
    `🧾 *Tax Invoice:* #${order.orderNumber} (${formatOrderType(order.orderType)})`,
    `📅 ${formattedDate}, ${formattedTime}`,
  ];
  if (order.tableNumber) {
    metaLines.push(`📍 Table: ${order.tableNumber}`);
  }

  // Items Section
  const itemsSection = [`*Order Summary:*`, ...itemsList];

  // Bill Totals Section
  const totalsSection: string[] = [
    `━━━━━━━━━━━━━━━━━━━━`,
    `Subtotal: ${formatINR(order.subtotal)}`,
  ];
  if (order.discountAmount > 0) {
    totalsSection.push(`Discount: -${formatINR(order.discountAmount)}`);
  }
  if (settings.enableLoyaltyProgram !== false && order.pointsDiscount > 0) {
    totalsSection.push(`Points Redeemed: -${formatINR(order.pointsDiscount)}`);
  }
  totalsSection.push(`GST (5%): ${formatINR(order.taxAmount)}`);
  totalsSection.push(`*Total Paid: ${formatINR(order.finalTotal)}* (via ${formatPaymentMethod(order.paymentMethod)})`);
  if (settings.enableLoyaltyProgram !== false && order.pointsEarned > 0) {
    totalsSection.push(`⭐ *Loyalty Points Earned:* +${order.pointsEarned} pts`);
  }

  // Footer & Link Section
  const footerSection: string[] = [
    `📲 *View & Download Digital Bill:*`,
    `${billUrl}`,
    ``,
    `Have a wonderful day & visit us again soon! ✨`,
  ];

  return [
    headerLines.join("\n"),
    metaLines.join("\n"),
    itemsSection.join("\n"),
    totalsSection.join("\n"),
    footerSection.join("\n"),
  ].join("\n\n");
}

/**
 * Builds the official WhatsApp link with encoded receipt text.
 * Note: Uses api.whatsapp.com directly instead of wa.me to prevent Meta 302 redirect bugs
 * that corrupt 4-byte UTF-8 emojis into replacement character question marks ().
 */
export function buildWhatsAppShareUrl(
  phone: string | undefined | null,
  messageText: string,
  defaultCountryCode = "91"
): { url: string; cleanPhone: string; hasDirectPhone: boolean } {
  const cleanPhone = normalizeWhatsAppPhone(phone, defaultCountryCode);
  const hasDirectPhone = cleanPhone.length >= 10;

  // Use https://api.whatsapp.com/send directly to preserve full UTF-8 encoding
  const url = hasDirectPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

  return { url, cleanPhone, hasDirectPhone };
}

/**
 * 1-Click WhatsApp screen dispatch via wa.me:
 * 1. Formats receipt
 * 2. Normalizes phone
 * 3. Opens WhatsApp Web / App
 * 4. Logs the dispatch event in local storage
 */
export function dispatchWhatsAppViaWeb(
  params: SendWhatsAppReceiptParams
): { success: boolean; url: string; cleanPhone: string; log: NotificationLog } {
  const { order, customer, settings, baseUrl = "", phoneOverride } = params;

  const rawPhone =
    phoneOverride !== undefined
      ? phoneOverride
      : order.customerPhone || customer?.phone || "";

  const effectiveBaseUrl = getAppBaseUrl(baseUrl);

  const customerName =
    order.customerName || customer?.name || "Valued Guest";
  const billUrl = `${effectiveBaseUrl}/bill/${order.id}`;

  const messagePayload = formatWhatsAppReceiptText({
    order,
    customer,
    settings,
    baseUrl: effectiveBaseUrl,
  });

  const { url, cleanPhone, hasDirectPhone } = buildWhatsAppShareUrl(
    rawPhone,
    messagePayload,
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "91"
  );

  // Open WhatsApp Web/App in a new window/tab
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const recipientPhone = hasDirectPhone
    ? `+${cleanPhone}`
    : rawPhone.trim() || "WhatsApp Contact Picker";

  // Create immediate notification audit record
  const log = addNotificationLog({
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientPhone,
    customerName,
    channel: "WHATSAPP",
    status: "SENT",
    statusCode: 200,
    messagePayload,
    billUrl,
  });

  // Notify listeners so Settings tab and audit logs update immediately
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }

  return { success: true, url, cleanPhone, log };
}

/**
 * Backward-compatible background receipt enqueuer
 */
export async function dispatchDigitalReceiptNotification(
  params: SendWhatsAppReceiptParams
): Promise<NotificationLog> {
  const { order, customer, settings, baseUrl = "" } = params;

  const recipientPhone =
    order.customerPhone || customer?.phone || "+91 99999 99999";
  const customerName =
    order.customerName || customer?.name || "Valued Guest";

  const effectiveBaseUrl = getAppBaseUrl(baseUrl);
  const billUrl = `${effectiveBaseUrl}/bill/${order.id}`;
  const messagePayload = formatWhatsAppReceiptText({
    order,
    customer,
    settings,
    baseUrl: effectiveBaseUrl,
  });

  console.log(`[WhatsApp Dispatch] Enqueuing notification for ${recipientPhone}...`);

  const log = addNotificationLog({
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientPhone,
    customerName,
    channel: "WHATSAPP",
    status: "SENT",
    statusCode: 200,
    messagePayload,
    billUrl,
  });

  return log;
}
