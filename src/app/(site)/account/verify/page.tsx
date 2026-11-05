import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmail } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Confirm Your Email", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14 lg:py-20">
      <p className="eyebrow text-teal">My account</p>
      <h1 className="headline mt-3 text-6xl">Confirm your email</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-24 animate-pulse bg-mist" />}>
          <VerifyEmail />
        </Suspense>
      </div>
    </section>
  );
}
