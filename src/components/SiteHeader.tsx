import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/wordpress";
import {
  CONTACT,
  COMPANY_LINKS,
  LOGO,
  RESOURCE_LINKS,
  SERIES_CATEGORIES,
  cartUrl,
  upload,
} from "@/lib/site";
import { CartIcon, ChevronIcon, PhoneIcon } from "./icons";
import MobileMenu from "./MobileMenu";

export default async function SiteHeader() {
  const categories = await getCategories();
  const types = categories.filter((c) => !SERIES_CATEGORIES.includes(c.slug));
  const series = categories.filter((c) => SERIES_CATEGORIES.includes(c.slug));
  const featured = types.filter((c) => c.image).slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 lg:h-20 lg:px-8">
        <div className="flex h-full items-center">
          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden h-full lg:block">
            <ul className="flex h-full items-center gap-7">
              <li className="group flex h-full items-center">
                <Link
                  href="/shop/"
                  className="eyebrow flex items-center gap-1 py-2 hover:text-teal"
                >
                  Shop <ChevronIcon width={14} height={14} />
                </Link>
                <div className="invisible absolute inset-x-0 top-full border-y border-line bg-white opacity-0 shadow-[0_24px_40px_-24px_rgba(7,34,43,0.35)] transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-8 px-8 py-10">
                    <div className="col-span-3">
                      <p className="eyebrow mb-4 text-muted">Shop by Fountain</p>
                      <ul className="space-y-2.5">
                        {types.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/prod-category/${c.slug}/`}
                              className="text-[15px] hover:text-teal"
                            >
                              {c.name.replace(/^COOL DOG\s+/i, "")}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-2">
                      <p className="eyebrow mb-4 text-muted">Series</p>
                      <ul className="space-y-2.5">
                        {series.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/prod-category/${c.slug}/`}
                              className="text-[15px] hover:text-teal"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                        <li className="pt-3">
                          <Link href="/shop/" className="link-underline text-[15px] font-semibold">
                            Shop All Fountains
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="col-span-7 grid grid-cols-2 gap-6">
                      {featured.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/prod-category/${c.slug}/`}
                          className="group/card flex gap-5 bg-mist p-4"
                        >
                          <span className="relative block aspect-square w-40 shrink-0 overflow-hidden">
                            {c.image && (
                              <Image
                                src={c.image.src}
                                alt={c.image.alt}
                                fill
                                sizes="160px"
                                className="object-contain transition duration-500 group-hover/card:scale-[1.04]"
                              />
                            )}
                          </span>
                          <span className="flex flex-col justify-center">
                            <span className="headline block text-3xl group-hover/card:text-teal">
                              {c.name.replace(/^COOL DOG\s+/i, "")}
                            </span>
                            <span className="eyebrow mt-3 inline-block text-teal">Shop Now</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </li>

              <li className="group flex h-full items-center">
                <Link
                  href="/dog-water-fountain-resources/"
                  className="eyebrow flex items-center gap-1 py-2 hover:text-teal"
                >
                  Resources <ChevronIcon width={14} height={14} />
                </Link>
                <div className="invisible absolute inset-x-0 top-full border-y border-line bg-white opacity-0 shadow-[0_24px_40px_-24px_rgba(7,34,43,0.35)] transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-8 px-8 py-10">
                    <div className="col-span-4">
                      <p className="eyebrow mb-4 text-muted">Plan & Install</p>
                      <ul className="space-y-2.5">
                        {RESOURCE_LINKS.map((l) => (
                          <li key={l.href}>
                            <Link href={l.href} className="text-[15px] hover:text-teal">
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-8 grid grid-cols-2 gap-6">
                      <Link
                        href="/dog-water-fountain-colors/"
                        className="group/card relative block aspect-[16/9] overflow-hidden bg-foam"
                      >
                        <Image
                          src={upload("2025/02/DL-2000-STE-BLU-lifestyle.jpg")}
                          alt="A dog drinking from a blue Cool Dog fountain"
                          fill
                          sizes="500px"
                          className="object-cover transition duration-500 group-hover/card:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-16 text-white">
                          <span className="headline block text-3xl">Color Play®</span>
                          <span className="eyebrow mt-2 inline-block">See the Colors</span>
                        </span>
                      </Link>
                      <Link
                        href="/dog-water-fountain-resources/"
                        className="group/card relative block aspect-[16/9] overflow-hidden bg-foam"
                      >
                        <Image
                          src={upload("2025/01/DSC_9804_WM-scaled-1.jpg")}
                          alt="A shaded dog park with turf and agility equipment"
                          fill
                          sizes="500px"
                          className="object-cover transition duration-500 group-hover/card:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-16 text-white">
                          <span className="headline block text-3xl">Architects & Contractors</span>
                          <span className="eyebrow mt-2 inline-block">Get Resources</span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </li>

              <li>
                <Link href="/dog-water-fountain-mission/" className="eyebrow py-2 hover:text-teal">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact-us/" className="eyebrow py-2 hover:text-teal">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <MobileMenu
            categories={types.map((c) => ({ slug: c.slug, name: c.name }))}
            resources={RESOURCE_LINKS}
            company={COMPANY_LINKS}
          />
        </div>

        {/* Logo */}
        <Link href="/" className="block" aria-label="Cool Dog Water Fountains – home">
          <Image
            src={LOGO.src}
            alt="Cool Dog Water Fountains"
            width={LOGO.width}
            height={LOGO.height}
            priority
            className="h-10 w-auto lg:h-14"
          />
        </Link>

        {/* Utilities */}
        <div className="flex items-center justify-end gap-4 lg:gap-6">
          <a
            href={CONTACT.phoneHref}
            className="eyebrow hidden items-center gap-2 hover:text-teal xl:flex"
          >
            <PhoneIcon width={16} height={16} /> {CONTACT.phone}
          </a>
          <Link href="/contact-us/" className="btn btn-primary hidden min-h-10 px-5 lg:inline-flex">
            Build a Quote
          </Link>
          <a href={cartUrl()} aria-label="Cart" className="hover:text-teal">
            <CartIcon width={22} height={22} />
          </a>
        </div>
      </div>
    </header>
  );
}
