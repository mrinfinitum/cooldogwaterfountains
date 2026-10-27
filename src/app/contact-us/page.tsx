import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import QuoteForm from "@/components/QuoteForm";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { CONTACT, upload } from "@/lib/site";
import { getPage, getProducts } from "@/lib/wordpress";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact-us");
  return {
    title: page?.seo.title ? { absolute: page.seo.title } : "Contact Us",
    description: page?.seo.description,
    alternates: { canonical: "/contact-us/" },
  };
}

export default async function ContactPage() {
  const products = await getProducts();
  const names = products.map((p) => p.name);

  return (
    <>
      <PageHero eyebrow="Contact Us · Build a Quote" title="How can we help you?">
        <p className="mt-6 max-w-2xl text-lg text-white/85">
          Contractor pricing, volume quotes, colors and installation help — tell us about your
          project and our team will get back to you within 48 hours.
        </p>
      </PageHero>

      <div className="mx-auto grid max-w-[1600px] gap-14 px-4 py-16 lg:grid-cols-12 lg:px-8 lg:py-24">
        <aside className="space-y-10 lg:col-span-4">
          <div>
            <p className="eyebrow text-teal">Sales & Support</p>
            <ul className="mt-5 space-y-4 text-lg">
              <li>
                <a href={CONTACT.phoneHref} className="flex items-center gap-3 hover:text-teal">
                  <PhoneIcon className="text-teal" /> {CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 break-all hover:text-teal"
                >
                  <MailIcon className="text-teal" /> {CONTACT.email}
                </a>
              </li>
              <li className="pl-8 text-base text-muted">Fax: {CONTACT.fax}</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-teal">Customer Support Hours</p>
            <p className="mt-3 text-lg">
              {CONTACT.hours}
              <br />
              {CONTACT.days}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-mist">
            <Image
              src={upload("2026/03/cool-dog-water-fountains-header.jpg")}
              alt="A dog drinking from a Cool Dog water fountain"
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        </aside>

        <section className="lg:col-span-8" aria-labelledby="quote-heading">
          <h2 id="quote-heading" className="headline text-5xl text-deep lg:text-7xl">
            Build a quote
          </h2>
          <p className="mb-10 mt-4 max-w-2xl text-ink/75">
            All of our products are made for easy installation, and installation and assembly is
            available across the USA. Ask about an installer in your area.
          </p>
          <Suspense fallback={<div className="h-[640px] animate-pulse bg-mist" />}>
            <QuoteForm products={names} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
