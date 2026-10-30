"use client";

import { useSyncExternalStore } from "react";

/**
 * Shopping cart, saved in the browser (localStorage). Prices stored here are
 * for display only: checkout re-prices every item on the server.
 */
export type CartItem = {
  slug: string;
  color?: string;
  quantity: number;
  name: string;
  /** Unit price in cents, for display. */
  price: number;
  image?: string;
};

const STORAGE_KEY = "cooldog-cart-v1";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let items: CartItem[] | null = null;

export const itemKey = (item: Pick<CartItem, "slug" | "color">) =>
  `${item.slug}::${item.color ?? ""}`;

function load(): CartItem[] {
  if (items) return items;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    items = Array.isArray(saved) ? saved : [];
  } catch {
    items = [];
  }
  return items;
}

function save(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage full: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      items = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, load, () => EMPTY);
  return {
    items: current,
    count: current.reduce((n, i) => n + i.quantity, 0),
    subtotal: current.reduce((n, i) => n + i.price * i.quantity, 0),
  };
}

export function addToCart(item: CartItem) {
  const current = load();
  const k = itemKey(item);
  const existing = current.find((i) => itemKey(i) === k);
  save(
    existing
      ? current.map((i) =>
          itemKey(i) === k
            ? { ...i, ...item, quantity: Math.min(99, i.quantity + item.quantity) }
            : i,
        )
      : [...current, { ...item, quantity: Math.min(99, Math.max(1, item.quantity)) }],
  );
}

export function setQuantity(key: string, quantity: number) {
  save(
    load()
      .map((i) =>
        itemKey(i) === key ? { ...i, quantity: Math.min(99, Math.max(0, quantity)) } : i,
      )
      .filter((i) => i.quantity > 0),
  );
}

export function removeFromCart(key: string) {
  save(load().filter((i) => itemKey(i) !== key));
}

export function clearCart() {
  save([]);
}
