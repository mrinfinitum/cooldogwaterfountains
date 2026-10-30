import type { Metadata } from "next";
import CheckoutView from "@/components/cart/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 lg:py-20">
      <p className="eyebrow text-teal">Secure checkout</p>
      <h1 className="headline mt-3 text-6xl lg:text-7xl">Checkout</h1>
      <div className="mt-10">
        <CheckoutView />
      </div>
    </section>
  );
}
