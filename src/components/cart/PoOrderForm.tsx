"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Address } from "@/lib/account";
import { postAccount, useAccount } from "@/lib/account-client";
import { clearCart, type CartItem } from "@/lib/cart";
import { formatPrice, shippingFor } from "@/lib/format";
import { CONTACT } from "@/lib/site";

const field =
  "mt-2 w-full border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-teal focus:ring-2 focus:ring-aqua/40";
const label = "eyebrow text-[11px]";

function AddressFields({ prefix, title, value }: { prefix: string; title: string; value?: Address }) {
  return (
    <fieldset className="grid gap-5 sm:col-span-2 sm:grid-cols-6">
      <legend className="eyebrow mb-1 text-muted sm:col-span-6">{title}</legend>
      <label className={`${label} sm:col-span-6`}>
        Street address *
        <input name={`${prefix}.line1`}
          defaultValue={value?.line1} required autoComplete={`${prefix} address-line1`} className={field} />
      </label>
      <label className={`${label} sm:col-span-6`}>
        Suite, unit, building
        <input name={`${prefix}.line2`}
          defaultValue={value?.line2} autoComplete={`${prefix} address-line2`} className={field} />
      </label>
      <label className={`${label} sm:col-span-3`}>
        City *
        <input name={`${prefix}.city`}
          defaultValue={value?.city} required autoComplete={`${prefix} address-level2`} className={field} />
      </label>
      <label className={`${label} sm:col-span-1`}>
        State *
        <input
          name={`${prefix}.state`}
          defaultValue={value?.state}
          required
          maxLength={2}
          pattern="[A-Za-z]{2}"
          title="Two-letter state code, e.g. GA"
          autoComplete={`${prefix} address-level1`}
          className={`${field} uppercase`}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        ZIP *
        <input
          name={`${prefix}.postalCode`}
          defaultValue={value?.postalCode}
          required
          inputMode="numeric"
          pattern="\d{5}(-\d{4})?"
          autoComplete={`${prefix} postal-code`}
          className={field}
        />
      </label>
    </fieldset>
  );
}

/**
 * "Pay by invoice / PO": sends the cart to /api/po-order/, which records the
 * order On hold and emails it to sales; sales invoices the buyer.
 */
export default function PoOrderForm({ items }: { items: CartItem[] }) {
  const [requestId] = useState(() => `po_${crypto.randomUUID()}`);
  const [sameAddress, setSameAddress] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ number: string; email: string } | null>(null);
  const account = useAccount();
  const customer = account.status === "signed-in" ? account.customer : null;
  const [saveDetails, setSaveDetails] = useState(true);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "");
    const address = (prefix: string) => ({
      line1: get(`${prefix}.line1`),
      line2: get(`${prefix}.line2`),
      city: get(`${prefix}.city`),
      state: get(`${prefix}.state`),
      postalCode: get(`${prefix}.postalCode`),
    });
    setStatus("sending");
    try {
      const res = await fetch("/api/po-order/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId,
          items: items.map(({ slug, color, quantity }) => ({ slug, color, quantity })),
          company: get("company"),
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          poNumber: get("poNumber"),
          notes: get("notes"),
          website: get("website"),
          billing: address("billing"),
          shipping: sameAddress ? undefined : address("shipping"),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.number) throw new Error(result.error || "Your order could not be placed.");
      clearCart();
      if (customer && saveDetails) {
        await postAccount("profile", {
          company: get("company"),
          phone: get("phone"),
          billing: address("billing"),
          shipping: sameAddress ? address("billing") : address("shipping"),
        }).catch(() => {});
      }
      setPlaced({ number: result.number, email: get("email") });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your order could not be placed.");
      setStatus("error");
    }
  };

  if (placed) {
    return (
      <div role="status" className="bg-foam p-8">
        <p className="eyebrow text-teal">Order received</p>
        <h2 className="headline mt-3 text-5xl">Order #{placed.number}</h2>
        <p className="mt-4 text-[15px] text-ink/80">
          Thank you. A confirmation is on its way to {placed.email}, and our sales team will email
          your invoice, usually within one business day. Questions? Call{" "}
          <a className="link-underline" href={CONTACT.phoneHref}>
            {CONTACT.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    // Re-mounts once the account loads, so its details fill the fields.
    <form key={account.status} onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      {/* Left empty by people; bots that fill it in are ignored. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      <div className="bg-mist p-5 text-[15px] sm:col-span-2">
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={`${i.slug}${i.color}`} className="flex justify-between gap-4">
              <span>
                {i.quantity} × {i.name}
                {i.color ? ` – ${i.color}` : ""}
              </span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3">
          <p className="flex justify-between">
            <span>Shipping (12% of order)</span>
            <span>{formatPrice(shippingFor(subtotal))}</span>
          </p>
          <p className="flex justify-between font-semibold">
            <span>Total before tax</span>
            <span>{formatPrice(subtotal + shippingFor(subtotal))}</span>
          </p>
          <p className="text-sm text-muted">Sales tax, if it applies, is added to your invoice.</p>
        </div>
      </div>

      <label className={label}>
        Company / Organization *
        <input name="company" required defaultValue={customer?.company} autoComplete="organization" className={field} />
      </label>
      <label className={label}>
        PO number
        <input name="poNumber" className={field} />
      </label>
      <label className={label}>
        Contact name *
        <input
          name="name"
          required
          defaultValue={customer ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") : undefined}
          autoComplete="name"
          className={field}
        />
      </label>
      <label className={label}>
        Phone *
        <input name="phone" type="tel" required defaultValue={customer?.phone} autoComplete="tel" className={field} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Email for the invoice *
        <input name="email" type="email" required defaultValue={customer?.email} autoComplete="email" className={field} />
      </label>

      <AddressFields prefix="billing" title="Billing address" value={customer?.billing} />
      <label className="flex items-center gap-3 text-[15px] sm:col-span-2">
        <input
          type="checkbox"
          checked={sameAddress}
          onChange={(e) => setSameAddress(e.target.checked)}
          className="size-4 accent-teal"
        />
        Ship to the billing address
      </label>
      {!sameAddress && <AddressFields prefix="shipping" title="Shipping address" value={customer?.shipping} />}

      <label className={`${label} sm:col-span-2`}>
        Notes (delivery instructions, tax exemption, etc.)
        <textarea name="notes" rows={3} className={field} />
      </label>

      {customer ? (
        <label className="flex items-center gap-3 text-[15px] sm:col-span-2">
          <input
            type="checkbox"
            checked={saveDetails}
            onChange={(e) => setSaveDetails(e.target.checked)}
            className="size-4 accent-teal"
          />
          Save these details to my account
        </label>
      ) : (
        account.status === "signed-out" && (
          <p className="text-sm text-muted sm:col-span-2">
            <Link href="/account/login/?next=/checkout/" className="link-underline">
              Sign in
            </Link>{" "}
            to fill this in from your account and see the order in My Account.
          </p>
        )
      )}

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? "Placing order…" : "Place order – pay by invoice"}
        </button>
        <p className="text-sm text-muted">No payment now. We&apos;ll email your invoice.</p>
      </div>
      {status === "error" && (
        <p role="alert" className="bg-foam p-4 text-[15px] sm:col-span-2">
          {error}
        </p>
      )}
    </form>
  );
}
