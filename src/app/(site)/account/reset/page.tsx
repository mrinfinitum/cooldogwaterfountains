import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Choose a New Password", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14 lg:py-20">
      <p className="eyebrow text-teal">My account</p>
      <h1 className="headline mt-3 text-6xl">Choose a new password</h1>
      <p className="mt-4 text-[15px] text-ink/75">Your new password works on every The Dog Park Company store.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-80 animate-pulse bg-mist" />}>
          <ResetForm />
        </Suspense>
      </div>
    </section>
  );
}
