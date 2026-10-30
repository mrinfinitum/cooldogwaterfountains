"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useCart } from "@/lib/cart";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutView() {
  const { items } = useCart();
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(({ slug, color, quantity }) => ({ slug, color, quantity })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.clientSecret) {
      const message = data.error ?? "Checkout is temporarily unavailable.";
      setError(message);
      throw new Error(message);
    }
    return data.clientSecret as string;
  }, [items]);

  if (!items.length) {
    return (
      <div className="py-10">
        <p className="text-lg text-ink/75">Your cart is empty.</p>
        <Link href="/shop/" className="btn btn-primary mt-6">
          Shop Fountains
        </Link>
      </div>
    );
  }
  if (!stripePromise) {
    return <p role="alert">Checkout is not configured yet (missing Stripe publishable key).</p>;
  }
  if (error) {
    return (
      <div role="alert" className="bg-foam p-6">
        <p>{error}</p>
        <Link href="/cart/" className="link-underline mt-3 inline-block">
          Back to cart
        </Link>
      </div>
    );
  }

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider
        key={items.map((i) => `${i.slug}${i.color}${i.quantity}`).join("|")}
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
