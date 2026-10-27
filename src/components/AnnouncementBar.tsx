import Link from "next/link";
import { CONTACT } from "@/lib/site";

export default function AnnouncementBar() {
  return (
    <div className="bg-deep text-white">
      <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-center gap-10 px-4 lg:justify-between lg:px-8">
        <a
          href={CONTACT.phoneHref}
          className="eyebrow hidden text-[11px] hover:text-aqua-light lg:block"
        >
          Call {CONTACT.phone}
        </a>
        <Link href="/contact-us/" className="eyebrow text-[11px] hover:text-aqua-light">
          Contractor Pricing — <span className="underline underline-offset-4">Build a Quote</span>
        </Link>
        <span className="eyebrow hidden text-[11px] lg:block">Made in the USA</span>
      </div>
    </div>
  );
}
