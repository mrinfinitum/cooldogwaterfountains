import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/content";
import { shortName } from "@/lib/format";
import CartButton from "./cart/CartButton";
import { CONTACT, COMPANY_LINKS, LOGO, RESOURCE_LINKS, media } from "@/lib/site";
import { ChevronIcon, PhoneIcon, UserIcon } from "./icons";
import MobileMenu from "./MobileMenu";
import ResourceLinkItem from "./sheets/ResourceLinkItem";
import SheetButton from "./sheets/SheetButton";

export default async function SiteHeader() {
  const products = await getProducts();

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
                  <div className="mx-auto max-w-[1600px] px-8 py-10">
                    <ul className="grid grid-cols-5 gap-6">
                      {products.map((p) => (
                        <li key={p.slug}>
                          <Link href={`/fountain/${p.slug}/`} className="group/card block">
                            <span className="relative block aspect-square overflow-hidden bg-mist">
                              {p.images[0] && (
                                <Image
                                  src={p.images[0].src}
                                  alt={p.images[0].alt}
                                  fill
                                  sizes="260px"
                                  className="object-contain transition duration-500 group-hover/card:scale-[1.04]"
                                />
                              )}
                            </span>
                            <span className="mt-3 block text-[15px] leading-snug group-hover/card:text-teal">
                              {shortName(p.name)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/shop/" className="link-underline mt-8 inline-block text-[15px] font-semibold">
                      Shop All Fountains
                    </Link>
                  </div>
                </div>
              </li>

              <li className="group flex h-full items-center">
                <button
                  type="button"
                  className="eyebrow flex items-center gap-1 py-2 hover:text-teal"
                  aria-haspopup="true"
                >
                  Resources <ChevronIcon width={14} height={14} />
                </button>
                <div className="invisible absolute inset-x-0 top-full border-y border-line bg-white opacity-0 shadow-[0_24px_40px_-24px_rgba(7,34,43,0.35)] transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-8 px-8 py-10">
                    <div className="col-span-4">
                      <p className="eyebrow mb-4 text-muted">Plan & Install</p>
                      <ul className="space-y-2.5">
                        {RESOURCE_LINKS.map((l) => (
                          <li key={l.label}>
                            <ResourceLinkItem link={l} className="text-[15px] hover:text-teal" />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-8 grid grid-cols-2 gap-6">
                      <SheetButton
                        sheet="colors"
                        className="group/card relative block aspect-[16/9] w-full overflow-hidden bg-foam"
                      >
                        <Image
                          src={media("DL-2000-STE-BLU-lifestyle.jpg")}
                          alt="A dog drinking from a blue Cool Dog fountain"
                          fill
                          sizes="500px"
                          className="object-cover transition duration-500 group-hover/card:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-16 text-white">
                          <span className="headline block text-3xl">Color Play®</span>
                          <span className="eyebrow mt-2 inline-block">See the Colors</span>
                        </span>
                      </SheetButton>
                      <Link
                        href="/shop/"
                        className="group/card relative block aspect-[16/9] overflow-hidden bg-foam"
                      >
                        <Image
                          src={media("DSC_9804_WM-scaled-1.jpg")}
                          alt="A shaded dog park with turf and agility equipment"
                          fill
                          sizes="500px"
                          className="object-cover transition duration-500 group-hover/card:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-16 text-white">
                          <span className="headline block text-3xl">Architects & Contractors</span>
                          <span className="eyebrow mt-2 inline-block">Spec Sheets &amp; CAD on Every Product</span>
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
            products={products.map((p) => ({ href: `/fountain/${p.slug}/`, label: shortName(p.name) }))}
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
            sizes="(min-width: 1024px) 156px, 112px"
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
          <Link href="/account/" aria-label="My account" className="hover:text-teal">
            <UserIcon width={22} height={22} />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
