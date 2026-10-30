import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductTabs from "@/components/ProductTabs";
import {
  ArrowIcon,
  DropIcon,
  FlagIcon,
  PaletteIcon,
  RulerIcon,
  ShieldIcon,
  Wave,
} from "@/components/icons";
import { CONTACT, HERO_POSTER, HERO_VIDEO, LOGO, SITE_NAME, SITE_URL, media } from "@/lib/site";
import {
  getCategories,
  getHomePage,
  getProducts,
  type Product,
  type ProductLine,
} from "@/lib/content";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHomePage();
  return buildMetadata({
    title: seo.title || "Dog Water Fountains for Dog Parks & Apartments | Cool Dog",
    description:
      seo.description ||
      "Commercial dog water fountains, bottle fillers and rinse stations for dog parks, apartments, HOAs and vet clinics. Made in the USA.",
    path: "/",
    image: media("cool-dog-water-fountains-header.jpg"),
  });
}

const FEATURES = [
  {
    icon: FlagIcon,
    title: "Made in the USA",
    text: "Our dog water fountains are designed and manufactured in the United States.",
  },
  {
    icon: ShieldIcon,
    title: "Built to Last",
    text: "Marine-grade 316 stainless steel and the highest quality outdoor coatings.",
  },
  {
    icon: DropIcon,
    title: "Drink, Wash, Cool",
    text: "Pet hose and rinse options cool dogs off and keep them hydrated.",
  },
  {
    icon: RulerIcon,
    title: "Architect Friendly",
    text: "Intelligently designed and hand crafted for parks, plazas and properties.",
  },
  {
    icon: PaletteIcon,
    title: "Color Play®",
    text: "A range of standard colors, plus custom colors to match your brand.",
  },
];

const COLOR_CHIPS = [
  { src: "cool-dog-water-fountains-blue1-1.jpg", name: "Blue" },
  { src: "cool-dog-water-fountains-GREEN2.jpg", name: "Green" },
  { src: "cool-dog-water-fountains-silver2.jpg", name: "Silver" },
  { src: "cool-dog-water-fountains-white2.jpg", name: "Bone White" },
  { src: "cool-dog-water-fountains-spicy-mustard.jpg", name: "Spicy Mustard" },
  { src: "cool-dog-water-fountains-SPECKLED-EARTH.jpg", name: "Speckled Earth" },
];

export default async function HomePage() {
  const [products, categories, home] = await Promise.all([
    getProducts(),
    getCategories(),
    getHomePage(),
  ]);
  // Product lines are edited in Sanity (Home page); categories are the fallback.
  const lines: ProductLine[] = home.productLines.length
    ? home.productLines
    : categories
        .filter((c) => !c.isSeries && c.image)
        .map((c) => ({
          title: c.name.replace(/^COOL DOG\s+/i, ""),
          subtitle: "",
          image: c.image,
          href: `/prod-category/${c.slug}/`,
        }));

  const inCategory = (slug: string) =>
    products.filter((p) => p.categories.some((c) => c.slug === slug));
  // Friendlier tab names for the series; other series use their Sanity name.
  const SERIES_LABELS: Record<string, string> = {
    "dog-water-fountain-sst": "Cool Dog Series (SST)",
    "dog-water-fountain-slv": "Fresh Flow Series (SLV)",
  };
  const tabs = [
    { id: "all", label: "All Fountains", items: products },
    ...categories
      .filter((c) => c.isSeries)
      .map((c) => ({
        id: c.slug,
        label: SERIES_LABELS[c.slug] ?? c.name,
        items: inCategory(c.slug),
      })),
  ].filter((t) => t.items.length > 0);

  // Structured data for search engines.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}${LOGO.src}`,
      telephone: `+1-${CONTACT.phone.replace(/\./g, "-")}`,
      email: CONTACT.email,
      parentOrganization: { "@type": "Organization", name: "The Dog Park Company" },
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate flex min-h-[min(78svh,820px)] items-end overflow-hidden bg-deep text-white lg:min-h-[min(86svh,960px)]">
        <Image
          src={media("cool-dog-water-fountains-header.jpg")}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <video
          className="absolute inset-0 -z-20 size-full object-cover motion-reduce:hidden"
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-deep/35 to-teal/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/55 via-ink/15 to-transparent" />
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-16 lg:px-8 lg:pb-24">
          <p className="eyebrow text-white">Dog Water Fountains · Made in the USA</p>
          <h1 className="headline mt-5 max-w-5xl text-[19vw] sm:text-[8.5rem] lg:text-[11rem]">
            Hydration
            <br />
            made easy
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            Top-quality dog water fountains and dog drinking fountains for parks, apartments, HOAs
            and daycares — built tough, made to keep every dog cool and hydrated.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#products" className="btn btn-light">
              Shop Fountains
            </Link>
            <Link
              href="/contact-us/"
              className="btn btn-outline hover:!border-white hover:!bg-white hover:!text-ink"
            >
              Build a Quote
            </Link>
          </div>
        </div>
        <Wave className="absolute -bottom-px left-0 h-6 w-full text-white" />
      </section>

      {/* ---------------- Shop by fountain ---------------- */}
      <section className="mx-auto max-w-[1600px] px-4 py-20 lg:px-8 lg:py-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-teal">The ultimate pet water fountain options</p>
            <h2 className="headline mt-3 text-6xl lg:text-8xl">Shop by fountain</h2>
          </div>
          <Link href="/shop/" className="eyebrow link-underline">
            Shop all fountains
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {lines.map((line) => (
            <Link key={line.href + line.subtitle} href={line.href} className="group flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-mist">
                {line.image && (
                  <Image
                    src={line.image.src}
                    alt={line.image.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain transition duration-700 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              {line.subtitle && <p className="eyebrow mt-5 text-teal">{line.subtitle}</p>}
              <h3 className="headline mt-2 text-3xl group-hover:text-teal">{line.title}</h3>
              <span className="eyebrow mt-auto inline-flex items-center gap-2 pt-4">
                Shop <ArrowIcon width={14} height={14} />
              </span>
            </Link>
          ))}
          <Link
            href="/contact-us/"
            className="group flex aspect-square flex-col justify-between bg-deep p-8 text-white"
          >
            <p className="eyebrow text-aqua">Not sure which fits?</p>
            <div>
              <h3 className="headline text-5xl">We&apos;ll help you choose</h3>
              <p className="mt-4 text-white/75">
                Tell us about your park or property and we&apos;ll recommend the right fountain.
              </p>
              <span className="btn btn-light mt-6 group-hover:bg-aqua-light">Build a Quote</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ---------------- 50 / 50: quality ---------------- */}
      <section className="grid bg-foam lg:grid-cols-2">
        <div className="relative aspect-square lg:aspect-auto lg:min-h-[640px]">
          <Image
            src={media("DL-2000-STE-BLU-lifestyle.jpg")}
            alt="A greyhound drinking from a blue Cool Dog water fountain"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex items-center px-6 py-16 sm:px-12 lg:px-20">
          <div className="max-w-xl">
            <p className="eyebrow text-teal">Parks · Apartments · HOAs · Vet Clinics</p>
            <h2 className="headline mt-4 text-6xl text-deep lg:text-7xl">
              Quality water fountains for dogs
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/80">
              Our Architectural Series dog water fountains are built for apartments, public parks,
              dog parks, city parks, veterinary clinics, doggie daycare centers, animal parks and
              HOAs.
            </p>
            <p className="mt-4 leading-relaxed text-ink/70">
              Available in several colors, a high-quality pet drinking fountain is a welcome amenity
              that makes any dog park a great place for dogs to play.
            </p>
            <Link href="/dog-water-fountain-mission/" className="btn btn-primary mt-8">
              Our Mission
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Product grid ---------------- */}
      <section
        id="products"
        className="mx-auto max-w-[1600px] scroll-mt-28 px-4 py-20 lg:px-8 lg:py-28"
      >
        <div className="mb-10">
          <p className="eyebrow text-teal">Contractor pricing on every model</p>
          <h2 className="headline mt-3 text-6xl lg:text-8xl">The fountains</h2>
        </div>
        <ProductTabs
          tabs={tabs.map((t) => ({
            id: t.id,
            label: `${t.label} (${t.items.length})`,
            content: <ProductGrid products={t.items} />,
          }))}
        />
      </section>

      {/* ---------------- Color Play ---------------- */}
      <section className="relative overflow-hidden bg-deep text-white">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-4 py-20 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="lg:col-span-4">
            <p className="eyebrow text-aqua">Color Play®</p>
            <h2 className="headline mt-4 text-6xl lg:text-8xl">Make a splash</h2>
            <p className="mt-6 text-lg text-white/80">
              Cool Dog fountains come in a range of cool colors to fit your dog play space or your
              brand — and we offer custom colors too.
            </p>
            <Link href="/dog-water-fountain-colors/" className="btn btn-light mt-8">
              See All Colors
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 lg:col-span-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
            {COLOR_CHIPS.map((chip, i) => (
              <figure
                key={chip.src}
                className={`w-40 shrink-0 snap-start lg:w-auto ${i % 2 ? "lg:translate-y-10" : ""}`}
              >
                <div className="relative aspect-[1406/1772] overflow-hidden shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
                  <Image
                    src={media(chip.src)}
                    alt={`${chip.name} color chip`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="eyebrow mt-3 text-[10px] text-aqua-light">
                  {chip.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Feature band ---------------- */}
      <section className="border-b border-line bg-white" aria-labelledby="why-heading">
        <h2 id="why-heading" className="sr-only">
          Why Cool Dog water fountains
        </h2>
        <div className="mx-auto grid max-w-[1600px] gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="bg-white px-6 py-12 lg:px-8">
              <div className="flex items-center justify-between text-teal">
                <Icon width={28} height={28} />
                <span className="eyebrow text-muted">0{i + 1}</span>
              </div>
              <h3 className="headline mt-8 text-3xl">{title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Story banners ---------------- */}
      <section className="mx-auto grid max-w-[1600px] gap-4 px-4 py-20 md:grid-cols-2 lg:px-8 lg:py-28">
        <StoryBanner
          href="/dog-park-designs/"
          image={media("RAMhpbanner.jpg")}
          alt="A pack of dogs on dog park agility equipment"
          eyebrow="Design & Operations"
          title="Dog park designs"
          cta="Plan Your Park"
        />
        <StoryBanner
          href="/dog-water-fountain-resources/"
          image={media("DSC_9804_WM-scaled-1.jpg")}
          alt="A shaded dog park with turf and agility equipment"
          eyebrow="Architects & Contractors"
          title="Specs & resources"
          cta="Get Resources"
        />
      </section>
    </>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function StoryBanner({
  href,
  image,
  alt,
  eyebrow,
  title,
  cta,
}: {
  href: string;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative isolate flex aspect-[4/5] items-end overflow-hidden text-white sm:aspect-[4/3]"
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="-z-10 object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-deep/20 to-transparent" />
      <div className="p-6 lg:p-10">
        <p className="eyebrow text-aqua-light">{eyebrow}</p>
        <h2 className="headline mt-3 text-5xl lg:text-7xl">{title}</h2>
        <span className="btn btn-light mt-6">{cta}</span>
      </div>
    </Link>
  );
}
