"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Address, Customer } from "@/lib/account";
import { postAccount, refreshAccount } from "@/lib/account-client";
import { field, label } from "./AuthForms";

function AddressFields({ prefix, value }: { prefix: string; value: Address }) {
  return (
    <div className="grid gap-5 sm:grid-cols-6">
      <label className={`${label} sm:col-span-6`}>
        Street address
        <input name={`${prefix}.line1`} defaultValue={value.line1} autoComplete={`${prefix} address-line1`} className={field} />
      </label>
      <label className={`${label} sm:col-span-6`}>
        Suite, unit, building
        <input name={`${prefix}.line2`} defaultValue={value.line2} autoComplete={`${prefix} address-line2`} className={field} />
      </label>
      <label className={`${label} sm:col-span-3`}>
        City
        <input name={`${prefix}.city`} defaultValue={value.city} autoComplete={`${prefix} address-level2`} className={field} />
      </label>
      <label className={`${label} sm:col-span-1`}>
        State
        <input
          name={`${prefix}.state`}
          defaultValue={value.state}
          maxLength={2}
          pattern="[A-Za-z]{2}"
          autoComplete={`${prefix} address-level1`}
          className={`${field} uppercase`}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        ZIP
        <input
          name={`${prefix}.postalCode`}
          defaultValue={value.postalCode}
          inputMode="numeric"
          pattern="\d{5}(-\d{4})?"
          autoComplete={`${prefix} postal-code`}
          className={field}
        />
      </label>
    </div>
  );
}

const readAddress = (data: FormData, prefix: string) => ({
  line1: data.get(`${prefix}.line1`),
  line2: data.get(`${prefix}.line2`),
  city: data.get(`${prefix}.city`),
  state: data.get(`${prefix}.state`),
  postalCode: data.get(`${prefix}.postalCode`),
});

export default function ProfileForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword && newPassword !== data.get("confirm")) {
      setMessage({ ok: false, text: "The new passwords don't match." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await postAccount("profile", {
        firstName: data.get("firstName"),
        lastName: data.get("lastName"),
        company: data.get("company"),
        phone: data.get("phone"),
        billing: readAddress(data, "billing"),
        shipping: readAddress(data, "shipping"),
        ...(newPassword ? { newPassword, currentPassword: data.get("currentPassword") } : {}),
      });
      for (const name of ["currentPassword", "newPassword", "confirm"]) {
        (form.elements.namedItem(name) as HTMLInputElement).value = "";
      }
      await refreshAccount();
      setMessage({ ok: true, text: "Saved." });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-10">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="headline mb-4 text-3xl">Details</legend>
        <label className={label}>
          First name
          <input name="firstName" defaultValue={customer.firstName} autoComplete="given-name" className={field} />
        </label>
        <label className={label}>
          Last name
          <input name="lastName" defaultValue={customer.lastName} autoComplete="family-name" className={field} />
        </label>
        <label className={label}>
          Company / Organization
          <input name="company" defaultValue={customer.company} autoComplete="organization" className={field} />
        </label>
        <label className={label}>
          Phone
          <input name="phone" type="tel" defaultValue={customer.phone} autoComplete="tel" className={field} />
        </label>
        <p className="text-sm text-muted sm:col-span-2">
          Email: {customer.email}. To change it, contact us.
        </p>
      </fieldset>

      <fieldset>
        <legend className="headline mb-4 text-3xl">Billing address</legend>
        <AddressFields prefix="billing" value={customer.billing} />
      </fieldset>
      <fieldset>
        <legend className="headline mb-4 text-3xl">Shipping address</legend>
        <AddressFields prefix="shipping" value={customer.shipping} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="headline mb-1 text-3xl">Change password</legend>
        <p className="text-sm text-muted sm:col-span-3">Leave blank to keep your current password.</p>
        <label className={label}>
          Current password
          <input name="currentPassword" type="password" autoComplete="current-password" className={field} />
        </label>
        <label className={label}>
          New password
          <input name="newPassword" type="password" minLength={8} autoComplete="new-password" className={field} />
        </label>
        <label className={label}>
          Confirm new password
          <input name="confirm" type="password" minLength={8} autoComplete="new-password" className={field} />
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save Changes"}
        </button>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-teal" : "text-[#b3261e]"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
