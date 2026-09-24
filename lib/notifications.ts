import { Order, Customer, CafeSettings, NotificationLog } from "./types";
import { addNotificationLog } from "./storage";
import { formatINR } from "./calculator";

export interface SendWhatsAppReceiptParams {
  order: Order;
  customer?: Customer | null;
  settings: CafeSettings;
  baseUrl?: string;
}

export async function dispatchDigitalReceiptNotification(
  params: SendWhatsAppReceiptParams
): Promise<NotificationLog> {
  const { order, customer, settings, baseUrl = "" } = params;

  const recipientPhone =
    order.customerPhone || customer?.phone || "+91 99999 99999";
  const customerName =
    order.customerName || customer?.name || "Valued Customer";

  const billUrl = `${baseUrl}/bill/${order.id}`;

  const messagePayload = 
    `☕ *${settings.cafeName}*\n` +
    `Hi ${customerName}! Thank you for dining with us.\n\n` +
    `🧾 *Invoice Details:*\n` +
    `• Order: #${order.orderNumber} (${order.orderType})\n` +
    `• Date: ${new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n` +
    `• Items: ${order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}\n` +
    `• Total Paid: *${formatINR(order.finalTotal)}* (${order.paymentMethod})\n` +
    (order.pointsEarned > 0 ? `• Loyalty Points Earned: *+${order.pointsEarned} pts* 🌟\n` : "") +
    (order.pointsRedeemed > 0 ? `• Points Redeemed: *-${order.pointsRedeemed} pts* (Saved ${formatINR(order.pointsDiscount)})\n` : "") +
    `\n🔗 *View or download your digital receipt:*\n${billUrl}\n\n` +
    `We hope to see you again soon! Have a wonderful day.`;

  // Simulating realistic network dispatch to WhatsApp Business Cloud API / Twilio
  console.log(`[WhatsApp Dispatch] Enqueuing notification to ${recipientPhone}...`);
  console.log(`[Payload]:\n${messagePayload}`);

  // Immediate log creation to ensure zero UI delay
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
