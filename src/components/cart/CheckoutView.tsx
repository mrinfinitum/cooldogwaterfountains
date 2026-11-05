"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useCart } from "@/lib/cart";
import PoOrderForm from "./PoOrderForm";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Method = "card" | "invoice";

export default function CheckoutView() {
  const { items } = useCart();
  const [method, setMethod] = useState<Method>("card");
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
        <p className="text-lg text-body">Your cart is empty.</p>
        <Link href="/shop/" className="btn btn-primary mt-6">
          Shop Fountains
        </Link>
      </div>
    );
  }
  const choice = (value: Method, title: string, note: string) => (
    <label
      className={`flex cursor-pointer items-start gap-3 border p-4 transition ${
        method === value ? "border-ink bg-mist" : "border-line hover:border-ink"
      }`}
    >
      <input
        type="radio"
        name="payment-method"
        value={value}
        checked={method === value}
        onChange={() => setMethod(value)}
        className="mt-1 size-4 accent-teal"
      />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{note}</span>
      </span>
    </label>
  );

  let content;
  if (method === "invoice") {
    content = <PoOrderForm items={items} />;
  } else if (!stripePromise) {
    content = <p role="alert">Card checkout is not configured yet (missing Stripe publishable key).</p>;
  } else if (error) {
    content = (
      <div role="alert" className="bg-foam p-6">
        <p>{error}</p>
        <Link href="/cart/" className="link-underline mt-3 inline-block">
          Back to cart
        </Link>
      </div>
    );
  } else {
    content = (
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

  return (
    <>
      <fieldset className="mb-8 grid gap-3 sm:grid-cols-2">
        <legend className="eyebrow mb-3 text-muted">How would you like to pay?</legend>
        {choice("card", "Pay by card now", "Secure checkout with Stripe. Sales tax calculated at checkout.")}
        {choice("invoice", "Pay by invoice / PO", "Place the order now and we'll email an invoice. For businesses, HOAs and public agencies.")}
      </fieldset>
      {content}
    </>
  );
}
