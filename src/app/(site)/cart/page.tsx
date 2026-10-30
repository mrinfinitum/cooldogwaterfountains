import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-14 lg:px-8 lg:py-20">
      <p className="eyebrow text-teal">Your order</p>
      <h1 className="headline mt-3 text-6xl lg:text-7xl">Cart</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </section>
  );
}
