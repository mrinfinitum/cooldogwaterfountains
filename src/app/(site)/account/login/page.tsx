import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Sign In", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14 lg:py-20">
      <p className="eyebrow text-teal">Welcome back</p>
      <h1 className="headline mt-3 text-6xl">Sign in</h1>
      <p className="mt-4 text-[15px] text-ink/75">Track orders, reorder and keep your saved fountains. One account works on every The Dog Park Company store.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-80 animate-pulse bg-mist" />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
