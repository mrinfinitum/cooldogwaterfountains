"use client";

import { sendGAEvent } from "@next/third-parties/google";

/**
 * Sends a Google Analytics 4 event. A no-op when GA isn't loaded (it only
 * runs on production, where NEXT_PUBLIC_GA_ID is set).
 */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !("dataLayer" in window)) return;
  sendGAEvent("event", event, params);
}

/** GA4 item for a cart line or product (prices in cents → dollars). */
export const gaItem = (item: { sku?: string; slug: string; name: string; color?: string; price: number; quantity: number }) => ({
  item_id: item.sku || item.slug,
  item_name: item.name,
  ...(item.color ? { item_variant: item.color } : {}),
  price: item.price / 100,
  quantity: item.quantity,
});
