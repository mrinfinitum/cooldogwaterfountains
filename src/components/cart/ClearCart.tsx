"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/** Empties the cart once an order has been paid. */
export default function ClearCart() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
