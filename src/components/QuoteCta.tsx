import Link from "next/link";
import { CONTACT } from "@/lib/site";

export default function QuoteCta() {
  return (
    <section className="bg-foam">
      <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 px-4 py-14 lg:flex-row lg:items-center lg:px-8">
        <div>
          <p className="eyebrow text-teal">Easy installation</p>
          <h2 className="headline mt-3 text-5xl text-deep lg:text-6xl">
            Ready to plan your project?
          </h2>
          <p className="mt-4 max-w-2xl text-ink/75">
            Most maintenance, engineering and construction staff can install our fountains.
            Installation and assembly is available in the USA — ask us for a quote or an installer
            in your area.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact-us/" className="btn btn-primary">
            Build a Quote
          </Link>
          <a href={CONTACT.phoneHref} className="btn btn-outline">
            Call {CONTACT.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
