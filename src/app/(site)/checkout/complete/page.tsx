import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ClearCart from "@/components/cart/ClearCart";
import { formatPrice } from "@/lib/format";
import { CONTACT } from "@/lib/site";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

async function OrderStatus({
  searchParams,
}: Pick<PageProps<"/checkout/complete">, "searchParams">) {
  const { session_id } = await searchParams;
  const id = typeof session_id === "string" ? session_id : "";
  const session = id.startsWith("cs_")
    ? await stripe()
        .checkout.sessions.retrieve(id)
        .catch(() => null)
    : null;

  if (!session) {
    return (
      <p className="text-lg">
        We couldn&apos;t find that order. If you were charged, call us at{" "}
        <a href={CONTACT.phoneHref} className="link-underline">
          {CONTACT.phone}
        </a>
        .
      </p>
    );
  }

  if (session.status !== "complete") {
    return (
      <div>
        <p className="text-lg">Your payment wasn&apos;t completed.</p>
        <Link href="/checkout/" className="btn btn-primary mt-6">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <ClearCart />
      <p className="text-lg">
        Thank you{session.customer_details?.name ? `, ${session.customer_details.name}` : ""}! Your
        order is confirmed and a receipt is on its way to{" "}
        <strong>{session.customer_details?.email}</strong>.
      </p>
      {session.amount_total != null && (
        <p className="mt-4 text-ink/75">Order total: {formatPrice(session.amount_total)}</p>
      )}
      <p className="mt-4 text-ink/75">
        Our team will be in touch about delivery. Questions? Call {CONTACT.phone} or email{" "}
        {CONTACT.email}.
      </p>
      <Link href="/shop/" className="btn btn-outline mt-8">
        Continue shopping
      </Link>
    </div>
  );
}

export default function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-14 lg:px-8 lg:py-20">
      <p className="eyebrow text-teal">Order confirmation</p>
      <h1 className="headline mt-3 text-6xl lg:text-7xl">Thank you</h1>
      <div className="mt-8">
        <Suspense fallback={<p className="text-lg">Checking your order…</p>}>
          <OrderStatus searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}
