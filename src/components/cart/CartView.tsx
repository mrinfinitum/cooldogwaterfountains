"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, SHIPPING_RATE, shippingFor } from "@/lib/format";
import { itemKey, removeFromCart, setQuantity, useCart } from "@/lib/cart";

export default function CartView() {
  const { items, subtotal } = useCart();

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

  const shipping = shippingFor(subtotal);

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <ul
        className="divide-y divide-line border-y border-line lg:col-span-8"
        aria-label="Cart items"
      >
        {items.map((item) => {
          const key = itemKey(item);
          return (
            <li key={key} className="flex gap-5 py-6">
              <div className="relative size-28 shrink-0 overflow-hidden bg-mist">
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="112px" className="object-contain" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Link href={`/fountain/${item.slug}/`} className="font-medium hover:text-teal">
                  {item.name}
                </Link>
                {item.color && (
                  <p className="eyebrow text-[11px] text-muted">Color: {item.color}</p>
                )}
                <p className="text-[15px]">{formatPrice(item.price)}</p>
                <div className="mt-auto flex items-center gap-4">
                  <div className="flex items-center border border-ink/20">
                    <button
                      type="button"
                      className="px-3 py-1.5"
                      onClick={() => setQuantity(key, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-3 py-1.5"
                      onClick={() => setQuantity(key, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(key)}
                    className="eyebrow text-[11px] text-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-semibold tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit bg-foam p-6 lg:col-span-4">
        <h2 className="headline text-4xl">Order summary</h2>
        <dl className="mt-6 space-y-3 text-[15px]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping ({Math.round(SHIPPING_RATE * 100)}%)</dt>
            <dd className="tabular-nums">{formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Sales tax</dt>
            <dd>Calculated at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
            <dt>Estimated total</dt>
            <dd className="tabular-nums">{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>
        <Link href="/checkout/" className="btn btn-primary mt-6 w-full">
          Checkout
        </Link>
        <p className="mt-4 text-sm text-muted">
          Secure card payment by Stripe. Need contractor or volume pricing?{" "}
          <Link href="/contact-us/" className="link-underline">
            Build a quote
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
