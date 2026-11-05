import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Reset Your Password", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14 lg:py-20">
      <p className="eyebrow text-teal">My account</p>
      <h1 className="headline mt-3 text-6xl">Reset your password</h1>
      <p className="mt-4 text-[15px] text-body">Enter the email on your account and we&apos;ll send you a link to choose a new password.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-80 animate-pulse bg-mist" />}>
          <ForgotForm />
        </Suspense>
      </div>
    </section>
  );
}
