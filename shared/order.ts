// Shared checkout constants — imported by both client and server so delivery
// fees, zones and payment details never drift between UI and order totals.

export const DELIVERY_ZONES = {
  inside: 80,
  near: 100,
  outside: 120,
} as const;

export type DeliveryZone = keyof typeof DELIVERY_ZONES;

export const DELIVERY_ZONE_LABELS: Record<DeliveryZone, string> = {
  inside: "Inside Dhaka",
  near: "Near Dhaka",
  outside: "Outside Dhaka",
};

export const FREE_DELIVERY_THRESHOLD = 3000;

export function deliveryFeeFor(zone: DeliveryZone, subtotal: number, threshold: number = FREE_DELIVERY_THRESHOLD): number {
  if (subtotal >= threshold) return 0;
  return DELIVERY_ZONES[zone] ?? DELIVERY_ZONES.outside;
}

export type PaymentMethod = "cod" | "online";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  online: "bKash / Nagad",
};

/** Official merchant number for bKash / Nagad Send Money. */
export const MERCHANT_SEND_MONEY_NUMBER = "01814108729";
