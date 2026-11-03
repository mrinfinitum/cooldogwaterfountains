"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Customer } from "./account";

/**
 * The signed-in customer as the browser sees it, loaded once per page view
 * from /api/account/me/ (pages themselves stay static and cacheable).
 */
export type AccountState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; customer: Customer; saved: string[] };

let state: AccountState = { status: "loading" };
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}

/** Re-reads the account (after signing in or out). */
export function refreshAccount() {
  if (!document.cookie.split("; ").some((c) => c.startsWith("cd_signed_in="))) {
    set({ status: "signed-out" });
    return (request = Promise.resolve());
  }
  request = fetch("/api/account/me/", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) =>
      set(data.signedIn ? { status: "signed-in", customer: data.customer, saved: data.saved } : { status: "signed-out" }),
    )
    .catch(() => set({ status: "signed-out" }));
  return request;
}

export function useAccount(): AccountState {
  useEffect(() => {
    if (!request) refreshAccount();
  }, []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

/** Saves or un-saves a product (optimistically). Returns false when signed out. */
export async function toggleSaved(slug: string): Promise<boolean> {
  if (state.status !== "signed-in") return false;
  const saving = !state.saved.includes(slug);
  const previous = state;
  set({ ...state, saved: saving ? [slug, ...state.saved] : state.saved.filter((s) => s !== slug) });
  try {
    const res = await fetch("/api/account/saved/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, saved: saving }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (state.status === "signed-in") set({ ...state, saved: data.saved });
  } catch {
    set(previous);
  }
  return true;
}

/** POSTs JSON to an account route; throws the server's message on failure. */
export async function postAccount<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/account/${path}/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}
