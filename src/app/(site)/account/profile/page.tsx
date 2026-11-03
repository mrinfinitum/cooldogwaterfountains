import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ProfileForm from "@/components/account/ProfileForm";
import { getCustomer } from "@/lib/account";

export const metadata: Metadata = { title: "Account Details", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 lg:py-20">
      <Link href="/account/" className="eyebrow link-underline text-[11px]">
        ← My account
      </Link>
      <h1 className="headline mt-6 text-6xl">Account details</h1>
      <p className="mt-3 text-[15px] text-ink/75">
        Used to fill in checkout on every The Dog Park Company store.
      </p>
      <div className="mt-10">
        <Suspense fallback={<div className="h-[640px] animate-pulse bg-mist" />}>
          <Profile />
        </Suspense>
      </div>
    </section>
  );
}

async function Profile() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login/?next=/account/profile/");
  return <ProfileForm customer={customer} />;
}
