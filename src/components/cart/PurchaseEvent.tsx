"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Sends GA4's "purchase" once per order (GA also de-duplicates by transaction ID). */
export default function PurchaseEvent({
  transactionId,
  value,
  tax,
  shipping,
  items,
}: {
  transactionId: string;
  value: number;
  tax: number;
  shipping: number;
  items: { item_name: string; price: number; quantity: number }[];
}) {
  useEffect(() => {
    const key = `ga-purchase-${transactionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: GA's own transaction ID de-duplication still applies.
    }
    track("purchase", { transaction_id: transactionId, currency: "USD", value, tax, shipping, items });
  }, [transactionId, value, tax, shipping, items]);
  return null;
}
