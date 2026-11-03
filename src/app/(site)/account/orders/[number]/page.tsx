import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ReorderButton } from "@/components/account/AccountActions";
import { AddressBlock, StatusBadge } from "@/components/account/OrderBits";
import { formatDate, getCustomer, getOrders } from "@/lib/account";
import type { CartItem } from "@/lib/cart";
import { getProducts } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Order", robots: { index: false, follow: false } };

export default function OrderPage({ params }: PageProps<"/account/orders/[number]">) {
  return (
    <section className="mx-auto max-w-[1000px] px-4 py-14 lg:px-8 lg:py-20">
      <Link href="/account/" className="eyebrow link-underline text-[11px]">
        ← My account
      </Link>
      <Suspense fallback={<div className="mt-6 h-[480px] animate-pulse bg-mist" />}>
        <OrderDetails params={params} />
      </Suspense>
    </section>
  );
}

async function OrderDetails({ params }: Pick<PageProps<"/account/orders/[number]">, "params">) {
  const { number } = await params;
  if (!(await getCustomer())) redirect(`/account/login/?next=/account/orders/${number}/`);
  const order = (await getOrders()).find((o) => o.number === number);
  if (!order) notFound();

  // "Order again": the items this store still sells, at today's prices.
  const products = await getProducts();
  const reorder: CartItem[] = [];
  for (const item of order.items) {
    const product = products.find((p) => p.slug === item.slug);
    if (!product?.inStock) continue;
    const option = item.color ? product.options.find((o) => o.color === item.color) : undefined;
    if (item.color && !option?.inStock) continue;
    reorder.push({
      slug: product.slug,
      color: option?.color,
      sku: option?.sku ?? product.sku,
      quantity: item.quantity,
      name: product.name,
      price: option?.price ?? product.price,
      image: option?.image?.src ?? product.images[0]?.src,
    });
  }
  const otherStore = order.storefront && order.storefront.name !== SITE_NAME ? order.storefront : null;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-6xl">Order #{order.number}</h1>
          <p className="mt-2 text-[15px] text-ink/75">
            Placed {formatDate(order.date)}
            {otherStore ? ` on ${otherStore.name}` : ""} · {order.paymentMethod}
            {order.poNumber ? ` · PO ${order.poNumber}` : ""}
          </p>
        </div>
        <StatusBadge order={order} />
      </div>

      {order.status === "on-hold" && (
        <p className="mt-6 bg-foam p-4 text-[15px]">
          We&apos;ll email your invoice; the order ships once it&apos;s paid or your terms are
          approved.
        </p>
      )}
      {order.tracking && (
        <p className="mt-6 bg-foam p-4 text-[15px]">
          <span className="font-semibold">Tracking:</span>{" "}
          {/^https?:\/\//.test(order.tracking) ? (
            <a href={order.tracking} className="link-underline" rel="noopener" target="_blank">
              Track your shipment
            </a>
          ) : (
            order.tracking
          )}
        </p>
      )}

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-4 py-4">
            <span className="relative block size-20 shrink-0 overflow-hidden bg-mist">
              {item.image && (
                <Image src={item.image.src} alt={item.image.alt} fill sizes="80px" className="object-contain" />
              )}
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">{item.name}</span>
              <span className="block text-sm text-muted">
                {item.sku ? `SKU ${item.sku} · ` : ""}Qty {item.quantity}
              </span>
            </span>
            <span className="font-semibold">{formatPrice(item.total)}</span>
          </li>
        ))}
      </ul>

      <dl className="ml-auto mt-6 grid max-w-xs grid-cols-2 gap-y-2 text-[15px]">
        <dt>Subtotal</dt>
        <dd className="text-right">{formatPrice(order.subtotal)}</dd>
        <dt>Shipping</dt>
        <dd className="text-right">{formatPrice(order.shipping)}</dd>
        <dt>Tax</dt>
        <dd className="text-right">
          {order.tax || order.paymentMethod !== "Invoice / PO" ? formatPrice(order.tax) : "On invoice"}
        </dd>
        <dt className="font-semibold">Total</dt>
        <dd className="text-right font-semibold">{formatPrice(order.total)}</dd>
      </dl>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2 text-muted">Billing address</p>
          <AddressBlock address={order.billing} />
        </div>
        <div>
          <p className="eyebrow mb-2 text-muted">Shipping address</p>
          <AddressBlock address={order.shippingTo} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {otherStore ? (
          <a href={otherStore.url} className="btn btn-outline">
            Shop {otherStore.name}
          </a>
        ) : (
          <ReorderButton items={reorder} />
        )}
        <Link href="/contact-us/" className="link-underline text-sm">
          Questions about this order?
        </Link>
      </div>
    </>
  );
}
