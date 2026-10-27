"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CONTACT } from "@/lib/site";

const PROJECT_TYPES = [
  "Dog park",
  "Apartment / condo",
  "HOA / community",
  "City or public park",
  "Vet clinic / daycare",
  "Other",
];

const field =
  "mt-2 w-full border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-teal focus:ring-2 focus:ring-aqua/40";

/**
 * Quote request form. It opens the visitor's email app with the request
 * filled in, addressed to the sales team — no form backend required.
 */
export default function QuoteForm({ products }: { products: string[] }) {
  const params = useSearchParams();
  const [sent, setSent] = useState(false);

  const presetProduct = params.get("product") ?? "";
  const presetColor = params.get("color") ?? "";
  const presetQty = params.get("quantity") ?? "1";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const body = [
      `Name: ${get("name")}`,
      `Company / organization: ${get("company")}`,
      `Email: ${get("email")}`,
      `Phone: ${get("phone")}`,
      `Project type: ${get("projectType")}`,
      `Project ZIP code: ${get("zip")}`,
      "",
      `Fountain: ${get("product")}`,
      `Color: ${get("color")}`,
      `Quantity: ${get("quantity")}`,
      "",
      get("message"),
    ].join("\n");

    const subject = `Quote request${get("product") ? ` – ${get("product")}` : ""}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <label className="eyebrow text-[11px]">
        Name *
        <input name="name" required autoComplete="name" className={field} />
      </label>
      <label className="eyebrow text-[11px]">
        Company / Organization
        <input name="company" autoComplete="organization" className={field} />
      </label>
      <label className="eyebrow text-[11px]">
        Email *
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="eyebrow text-[11px]">
        Phone
        <input name="phone" type="tel" autoComplete="tel" className={field} />
      </label>
      <label className="eyebrow text-[11px]">
        Project Type
        <select name="projectType" className={field} defaultValue="">
          <option value="">Select…</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="eyebrow text-[11px]">
        Project ZIP Code
        <input name="zip" autoComplete="postal-code" inputMode="numeric" className={field} />
      </label>
      <label className="eyebrow text-[11px] sm:col-span-2">
        Fountain
        <select name="product" className={field} defaultValue={presetProduct}>
          <option value="">Not sure yet — help me choose</option>
          {presetProduct && !products.includes(presetProduct) && <option>{presetProduct}</option>}
          {products.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="eyebrow text-[11px]">
        Color
        <input name="color" defaultValue={presetColor} className={field} />
      </label>
      <label className="eyebrow text-[11px]">
        Quantity
        <input name="quantity" type="number" min={1} defaultValue={presetQty} className={field} />
      </label>
      <label className="eyebrow text-[11px] sm:col-span-2">
        Tell us about your project
        <textarea name="message" rows={5} className={field} />
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" className="btn btn-primary">
          Send Quote Request
        </button>
        <p className="text-sm text-muted">Opens your email app, addressed to {CONTACT.email}.</p>
      </div>
      {sent && (
        <p role="status" className="bg-foam p-4 text-[15px] sm:col-span-2">
          Your email app should open with your request filled in. If it didn&apos;t, email{" "}
          <a className="link-underline" href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>{" "}
          or call{" "}
          <a className="link-underline" href={CONTACT.phoneHref}>
            {CONTACT.phone}
          </a>
          .
        </p>
      )}
    </form>
  );
}
