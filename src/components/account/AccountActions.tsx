"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postAccount, refreshAccount, toggleSaved } from "@/lib/account-client";
import { addToCart, type CartItem } from "@/lib/cart";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="link-underline text-sm"
      onClick={async () => {
        await postAccount("logout", {});
        await refreshAccount();
        router.push("/account/login/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

/** Puts a past order's items back in the cart (at today's prices) and opens the cart. */
export function ReorderButton({ items }: { items: CartItem[] }) {
  const router = useRouter();
  if (!items.length) return null;
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => {
        items.forEach(addToCart);
        router.push("/cart/");
      }}
    >
      Order Again
    </button>
  );
}

export function RemoveSavedButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="link-underline text-sm text-muted"
      onClick={async () => {
        setBusy(true);
        await refreshAccount();
        await toggleSaved(slug);
        router.refresh();
      }}
    >
      Remove
    </button>
  );
}

/** Emails a new link to confirm the account's email. */
export function ResendVerifyButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  if (state === "sent") return <p className="mt-3 text-[15px]">Sent. Check your inbox (and spam folder) for the link.</p>;
  return (
    <>
      <button
        type="button"
        className="btn btn-primary mt-4"
        disabled={state === "sending"}
        onClick={async () => {
          setState("sending");
          setError("");
          try {
            await postAccount("verify-email", {});
            setState("sent");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
            setState("idle");
          }
        }}
      >
        {state === "sending" ? "Sending…" : "Email Me the Link"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-[15px]">
          {error}
        </p>
      )}
    </>
  );
}
