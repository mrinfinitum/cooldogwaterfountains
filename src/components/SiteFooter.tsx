import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { getCategories } from "@/lib/wordpress";
import {
  CONTACT,
  COMPANY_LINKS,
  LEGAL_LINKS,
  LOGO_LIGHT,
  RESOURCE_LINKS,
  SERIES_CATEGORIES,
  upload,
} from "@/lib/site";
import { Wave } from "./icons";

const PARTNERS = [
  {
    href: "https://www.thedogparkcompany.com",
    src: "2025/02/icon-pet-care-leaders.png",
    alt: "Pet care leaders",
  },
  {
    href: "http://www.dogparkveterinarians.com/",
    src: "2025/02/icon-find-a-vet.png",
    alt: "Find a vet",
  },
  {
    href: "https://www.dogparkadventures.com",
    src: "2025/02/icon-find-a-dog-park.png",
    alt: "Find a dog park",
  },
  {
    href: "https://www.petfinder.com/",
    src: "2025/02/icon-find-adopt-a-dog.png",
    alt: "Find and adopt a dog",
  },
  {
    href: "https://www.dogsnaturallymagazine.com/blog/",
    src: "2025/02/pet-wellness.png",
    alt: "Pet wellness",
  },
];

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export default async function SiteFooter() {
  const categories = await getCategories();
  const types = categories.filter((c) => !SERIES_CATEGORIES.includes(c.slug));

  return (
    <footer className="relative bg-ink text-white">
      <Wave className="absolute -top-[23px] left-0 h-6 w-full text-ink" />

      {/* Brand band */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-7">
            <p className="eyebrow text-aqua">Hydration Made Easy</p>
            <h2 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl">
              Built to keep
              <br />
              dogs cool.
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-6 lg:col-span-5">
            <p className="max-w-md text-lg text-white/75">
              Commercial-grade dog water fountains for parks, apartments, HOAs, vet clinics and
              daycares — designed and made in the USA.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact-us/" className="btn btn-light">
                Build a Quote
              </Link>
              <a
                href={CONTACT.phoneHref}
                className="btn btn-outline hover:!border-white hover:!bg-white hover:!text-ink"
              >
                Call {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-3">
          <Link href="/" aria-label="Cool Dog Water Fountains – home">
            <Image
              src={LOGO_LIGHT.src}
              alt="Cool Dog Water Fountains"
              width={LOGO_LIGHT.width}
              height={LOGO_LIGHT.height}
              className="h-16 w-auto"
            />
          </Link>
          <p className="mt-6 text-sm text-white/60">A brand of The Dog Park Company.</p>
        </div>

        <FooterColumn title="Fountains" className="lg:col-span-3">
          {types.map((c) => (
            <FooterLink key={c.slug} href={`/prod-category/${c.slug}/`}>
              {c.name.replace(/^COOL DOG\s+/i, "")}
            </FooterLink>
          ))}
          <FooterLink href="/shop/">Shop All</FooterLink>
        </FooterColumn>

        <FooterColumn title="Resources" className="lg:col-span-2">
          {RESOURCE_LINKS.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Company" className="lg:col-span-2">
          {COMPANY_LINKS.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Support" className="lg:col-span-2">
          <li>
            <a href={CONTACT.phoneHref} className="hover:text-aqua">
              {CONTACT.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${CONTACT.email}`} className="break-all hover:text-aqua">
              {CONTACT.email}
            </a>
          </li>
          <li className="text-white/60">
            {CONTACT.hours}
            <br />
            {CONTACT.days}
          </li>
        </FooterColumn>
      </div>

      {/* Partners */}
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-10 gap-y-6 border-t border-white/10 px-4 py-10 lg:justify-between lg:px-8">
        <a href="https://www.thedogparkcompany.com" target="_blank" rel="noopener noreferrer">
          <Image
            src={upload("2025/02/TDPC_Logo.png")}
            alt="The Dog Park Company"
            width={639}
            height={82}
            className="h-6 w-auto opacity-80 brightness-0 invert hover:opacity-100"
          />
        </a>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {PARTNERS.map((p) => (
            <a key={p.src} href={p.href} target="_blank" rel="noopener noreferrer">
              <Image
                src={upload(p.src)}
                alt={p.alt}
                width={500}
                height={699}
                className="h-14 w-auto opacity-70 transition hover:opacity-100"
              />
            </a>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div className="bg-black/30">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-4 text-white/60 sm:flex-row lg:px-8">
          <p className="eyebrow text-[11px]">
            © <CopyrightYear /> The Dog Park Company. All rights reserved.
          </p>
          <ul className="flex gap-6">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="eyebrow text-[11px] hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <h3 className="eyebrow mb-5 text-aqua">{title}</h3>
      <ul className="space-y-2.5 text-[15px] text-white/85">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-aqua">
        {children}
      </Link>
    </li>
  );
}
