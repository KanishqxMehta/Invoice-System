import { CartItem, Coupon, CafeSettings } from "./types";

export interface BillCalculationResult {
  subtotal: number;
  couponDiscount: number;
  pointsDiscount: number;
  pointsRedeemed: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  taxAmount: number;
  finalTotal: number;
  roundOff: number;
  pointsEarned: number;
  isValidCoupon: boolean;
  couponError?: string;
}

export function calculateCartItemTotal(
  basePrice: number,
  modifiers: { price: number }[],
  quantity: number
): { unitTotal: number; itemTotal: number } {
  const modifiersTotal = modifiers.reduce((sum, mod) => sum + mod.price, 0);
  const unitTotal = Math.max(0, basePrice + modifiersTotal);
  const itemTotal = unitTotal * Math.max(1, quantity);
  return { unitTotal, itemTotal };
}

export function calculateBill(params: {
  cart: CartItem[];
  coupon?: Coupon | null;
  pointsToRedeem?: number;
  customerPointsBalance?: number;
  settings: CafeSettings;
  overrideLoyaltyPercent?: number | null;
  overridePointsEarned?: number | null;
}): BillCalculationResult {
  const {
    cart,
    coupon,
    pointsToRedeem = 0,
    customerPointsBalance = 0,
    settings,
    overrideLoyaltyPercent = null,
    overridePointsEarned = null,
  } = params;

  // 1. Subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // 2. Coupon Validation & Discount
  let couponDiscount = 0;
  let isValidCoupon = false;
  let couponError: string | undefined = undefined;

  if (coupon) {
    if (!coupon.isActive) {
      couponError = "This coupon is currently inactive.";
    } else if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      couponError = "This coupon has expired.";
    } else if (subtotal < coupon.minOrder) {
      couponError = `Minimum order amount of ${settings.currencySymbol}${coupon.minOrder} required.`;
    } else {
      isValidCoupon = true;
      if (coupon.discountType === "PERCENT") {
        const rawDiscount = (subtotal * coupon.value) / 100;
        couponDiscount = coupon.maxDiscount
          ? Math.min(rawDiscount, coupon.maxDiscount)
          : rawDiscount;
      } else {
        // FLAT discount
        couponDiscount = Math.min(coupon.value, subtotal);
      }
    }
  }

  // Ensure coupon discount does not exceed subtotal
  couponDiscount = Math.min(couponDiscount, subtotal);
  const remainingAfterCoupon = Math.max(0, subtotal - couponDiscount);

  // 3. Loyalty Points Redemption
  // 1 point = pointRedeemRateInr (default ₹1)
  const maxRedeemablePoints = Math.floor(
    remainingAfterCoupon / settings.pointRedeemRateInr
  );
  const eligiblePoints = Math.min(
    pointsToRedeem,
    customerPointsBalance,
    maxRedeemablePoints
  );
  const safePointsRedeemed = Math.max(0, eligiblePoints);
  const pointsDiscount = safePointsRedeemed * settings.pointRedeemRateInr;

  // 4. Taxable Amount (Post-discounts)
  const taxableAmount = Math.max(0, remainingAfterCoupon - pointsDiscount);

  // 5. Taxes (CGST & SGST for India GST 5%)
  const cgst = Number(((taxableAmount * settings.cgstRatePercent) / 100).toFixed(2));
  const sgst = Number(((taxableAmount * settings.sgstRatePercent) / 100).toFixed(2));
  const taxAmount = Number((cgst + sgst).toFixed(2));

  // 6. Net Total and Round Off
  const rawFinalTotal = taxableAmount + taxAmount;
  const roundedFinalTotal = Math.round(rawFinalTotal);
  const roundOff = Number((roundedFinalTotal - rawFinalTotal).toFixed(2));

  // 7. Points Earned on this Order (based on final spent amount)
  let pointsEarned = 0;
  if (overridePointsEarned !== undefined && overridePointsEarned !== null) {
    pointsEarned = Math.max(0, Math.floor(overridePointsEarned));
  } else if (overrideLoyaltyPercent !== undefined && overrideLoyaltyPercent !== null) {
    pointsEarned = Math.max(0, Math.round((roundedFinalTotal * Math.max(0, overrideLoyaltyPercent)) / 100));
  } else if (settings.loyaltyEarnMode === "SPEND_RATIO") {
    pointsEarned = settings.pointEarnRateRatio > 0
      ? Math.floor(roundedFinalTotal / settings.pointEarnRateRatio)
      : 0;
  } else {
    // Default PERCENTAGE mode (e.g. 5% cashback awarded as loyalty points)
    const pct = settings.loyaltyEarnPercent ?? 5;
    pointsEarned = Math.max(0, Math.round((roundedFinalTotal * Math.max(0, pct)) / 100));
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    pointsDiscount: Number(pointsDiscount.toFixed(2)),
    pointsRedeemed: safePointsRedeemed,
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgst,
    sgst,
    taxAmount,
    finalTotal: roundedFinalTotal,
    roundOff,
    pointsEarned,
    isValidCoupon,
    couponError,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}
