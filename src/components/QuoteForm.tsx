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

/** Quote request form. Sends the request to the sales team by email (see /api/quote/). */
export default function QuoteForm({ products }: { products: string[] }) {
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const presetProduct = params.get("product") ?? "";
  const presetColor = params.get("color") ?? "";
  const presetQty = params.get("quantity") ?? "1";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const res = await fetch("/api/quote/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Your request could not be sent.");
      form.reset();
      setStatus("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your request could not be sent.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p role="status" className="bg-foam p-6 text-[15px]">
        Thanks — your quote request is on its way to our sales team. We&apos;ll reply by email,
        usually within one business day. Need it sooner? Call{" "}
        <a className="link-underline" href={CONTACT.phoneHref}>
          {CONTACT.phone}
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      {/* Left empty by people; bots that fill it in are ignored. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
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
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send Quote Request"}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className="bg-foam p-4 text-[15px] sm:col-span-2">
          {error} Please email{" "}
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
