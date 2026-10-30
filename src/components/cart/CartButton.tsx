"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { CartIcon } from "../icons";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/cart/"
      aria-label={count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className="relative hover:text-teal"
    >
      <CartIcon width={22} height={22} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-teal text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
