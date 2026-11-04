"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { postAccount, refreshAccount } from "@/lib/account-client";
import { track } from "@/lib/analytics";

export const field =
  "mt-2 w-full border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-teal focus:ring-2 focus:ring-aqua/40";
export const label = "eyebrow block text-[11px]";

/** Where to go after signing in: a same-site path from ?next=, or the account page. */
function useNext() {
  const next = useSearchParams().get("next") ?? "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account/";
}

function useSubmit(action: (data: FormData) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await action(new FormData(event.currentTarget));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, onSubmit };
}

function Form({
  onSubmit,
  error,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error: string;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {children}
      {error && (
        <p role="alert" className="bg-foam p-4 text-[15px]">
          {error}
        </p>
      )}
    </form>
  );
}

const EmailField = () => (
  <label className={label}>
    Email
    <input name="email" type="email" required autoComplete="email" className={field} />
  </label>
);

export function LoginForm() {
  const router = useRouter();
  const next = useNext();
  const { busy, error, onSubmit } = useSubmit(async (data) => {
    await postAccount("login", { email: data.get("email"), password: data.get("password") });
    await refreshAccount();
    router.push(next);
    router.refresh();
  });
  return (
    <Form onSubmit={onSubmit} error={error}>
      <EmailField />
      <label className={label}>
        Password
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
        <Link href="/account/forgot/" className="link-underline text-sm">
          Forgot your password?
        </Link>
      </div>
      <p className="text-[15px] text-ink/75">
        New here?{" "}
        <Link href={`/account/register/?next=${encodeURIComponent(next)}`} className="link-underline">
          Create an account
        </Link>
      </p>
    </Form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const next = useNext();
  const { busy, error, onSubmit } = useSubmit(async (data) => {
    if (data.get("password") !== data.get("confirm")) throw new Error("The passwords don't match.");
    await postAccount("register", Object.fromEntries(data));
    track("sign_up", { method: "email" });
    await refreshAccount();
    router.push(next);
    router.refresh();
  });
  return (
    <Form onSubmit={onSubmit} error={error}>
      {/* Left empty by people; bots that fill it in are ignored. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          First name
          <input name="firstName" required autoComplete="given-name" className={field} />
        </label>
        <label className={label}>
          Last name
          <input name="lastName" required autoComplete="family-name" className={field} />
        </label>
        <label className={label}>
          Company / Organization
          <input name="company" autoComplete="organization" className={field} />
        </label>
        <label className={label}>
          Phone
          <input name="phone" type="tel" autoComplete="tel" className={field} />
        </label>
      </div>
      <EmailField />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Password (8+ characters)
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
        </label>
        <label className={label}>
          Confirm password
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={field} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Creating account…" : "Create Account"}
        </button>
        <p className="text-sm text-muted">One account for every The Dog Park Company store.</p>
      </div>
      <p className="text-[15px] text-ink/75">
        Already have an account?{" "}
        <Link href={`/account/login/?next=${encodeURIComponent(next)}`} className="link-underline">
          Sign in
        </Link>
      </p>
    </Form>
  );
}

export function ForgotForm() {
  const [sent, setSent] = useState("");
  const { busy, error, onSubmit } = useSubmit(async (data) => {
    await postAccount("forgot", { email: data.get("email") });
    setSent(String(data.get("email")));
  });
  if (sent) {
    return (
      <p role="status" className="bg-foam p-6 text-[15px]">
        If there&apos;s an account for {sent}, a link to reset your password is on its way. It
        works once and expires in 24 hours. Check your spam folder if it doesn&apos;t arrive in a
        few minutes.
      </p>
    );
  }
  return (
    <Form onSubmit={onSubmit} error={error}>
      <EmailField />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Sending…" : "Email Me a Reset Link"}
        </button>
        <Link href="/account/login/" className="link-underline text-sm">
          Back to sign in
        </Link>
      </div>
    </Form>
  );
}

export function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { busy, error, onSubmit } = useSubmit(async (data) => {
    if (data.get("password") !== data.get("confirm")) throw new Error("The passwords don't match.");
    await postAccount("reset", {
      login: params.get("login"),
      key: params.get("key"),
      password: data.get("password"),
    });
    await refreshAccount();
    router.push("/account/");
    router.refresh();
  });
  if (!params.get("login") || !params.get("key")) {
    return (
      <p role="alert" className="bg-foam p-6 text-[15px]">
        This reset link is incomplete.{" "}
        <Link href="/account/forgot/" className="link-underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }
  return (
    <Form onSubmit={onSubmit} error={error}>
      <label className={label}>
        New password (8+ characters)
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      <label className={label}>
        Confirm new password
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      <button type="submit" className="btn btn-primary justify-self-start" disabled={busy}>
        {busy ? "Saving…" : "Set New Password"}
      </button>
    </Form>
  );
}
