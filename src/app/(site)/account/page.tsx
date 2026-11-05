import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RemoveSavedButton, ResendVerifyButton, SignOutButton } from "@/components/account/AccountActions";
import { AddressBlock, StatusBadge } from "@/components/account/OrderBits";
import { formatDate, getCustomer, getOrders, getSaved } from "@/lib/account";
import { formatPrice, shortName } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "My Account", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-14 lg:px-8 lg:py-20">
      <p className="eyebrow text-teal">My account</p>
      <Suspense fallback={<div className="mt-6 h-[480px] animate-pulse bg-mist" />}>
        <Dashboard />
      </Suspense>
    </section>
  );
}

async function Dashboard() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login/?next=/account/");
  const [orders, saved] = await Promise.all([getOrders(), getSaved()]);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="headline text-6xl lg:text-7xl">
          Hi{customer.firstName ? `, ${customer.firstName}` : ""}
        </h1>
        <SignOutButton />
      </div>
      <p className="mt-3 text-[15px] text-ink/75">
        Your account works on every The Dog Park Company store; orders from each are listed here.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="headline text-4xl">Orders</h2>
          {!customer.emailVerified ? (
            <div className="mt-6 bg-foam p-6 text-[15px]">
              <p>
                To show your orders, please confirm that <strong>{customer.email}</strong> is your email. We sent
                you a link when you signed up.
              </p>
              <ResendVerifyButton />
            </div>
          ) : orders.length ? (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.number}/`}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 hover:bg-mist"
                  >
                    <span>
                      <span className="block font-semibold">Order #{o.number}</span>
                      <span className="block text-sm text-muted">
                        {formatDate(o.date)}
                        {o.storefront && o.storefront.name !== SITE_NAME ? ` · ${o.storefront.name}` : ""}
                        {o.poNumber ? ` · PO ${o.poNumber}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <StatusBadge order={o} />
                      <span className="w-20 text-right font-semibold">{formatPrice(o.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-[15px] text-ink/75">
              No orders yet.{" "}
              <Link href="/shop/" className="link-underline">
                Shop fountains
              </Link>
            </p>
          )}

          <h2 className="headline mt-14 text-4xl">Saved</h2>
          {saved.length ? (
            <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {saved.map((s) => {
                const external = !s.availableHere;
                const href = external ? s.url : `/fountain/${s.slug}/`;
                return (
                  <li key={s.productId} className="flex flex-col">
                    <a href={href} className="group block">
                      <span className="relative block aspect-square overflow-hidden bg-mist">
                        {s.image && (
                          <Image
                            src={s.image.src}
                            alt={s.image.alt}
                            fill
                            sizes="240px"
                            className="object-contain transition duration-500 group-hover:scale-[1.03]"
                          />
                        )}
                      </span>
                      <span className="mt-3 block text-[15px] leading-snug group-hover:text-teal">
                        {shortName(s.name)}
                      </span>
                    </a>
                    <span className="mt-1 text-sm text-muted">
                      {external && s.storefront ? `On ${s.storefront.name}` : formatPrice(s.price)}
                    </span>
                    <span className="mt-2">
                      <RemoveSavedButton slug={s.slug} />
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 text-[15px] text-ink/75">
              Tap <strong>Save</strong> on any fountain to keep it here.
            </p>
          )}
        </div>

        <aside className="space-y-8 bg-mist p-6 lg:col-span-4">
          <div className="flex items-baseline justify-between">
            <h2 className="headline text-3xl">Details</h2>
            <Link href="/account/profile/" className="link-underline text-sm">
              Edit
            </Link>
          </div>
          <div className="text-[15px] leading-relaxed">
            <p className="font-semibold">
              {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"}
            </p>
            {customer.company && <p>{customer.company}</p>}
            <p>{customer.email}</p>
            {customer.phone && <p>{customer.phone}</p>}
          </div>
          <div>
            <p className="eyebrow mb-2 text-muted">Billing address</p>
            <AddressBlock address={customer.billing} />
          </div>
          <div>
            <p className="eyebrow mb-2 text-muted">Shipping address</p>
            <AddressBlock address={customer.shipping} />
          </div>
        </aside>
      </div>
    </>
  );
}
