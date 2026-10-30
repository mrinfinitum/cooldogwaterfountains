import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import ProductView from "@/components/ProductView";
import QuoteCta from "@/components/QuoteCta";
import RichText from "@/components/RichText";
import { ChevronIcon } from "@/components/icons";
import { RESOURCE_LINKS, SITE_NAME } from "@/lib/site";
import { productMetadata } from "@/lib/seo";
import { getProduct, getProducts, type Product } from "@/lib/content";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/fountain/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product ? productMetadata(product) : {};
}

const seriesOf = (p: Product) => p.name.match(/\((SST|SLV|STE)\)/)?.[1];

function Accordion({
  title,
  children,
  open = false,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="eyebrow flex cursor-pointer list-none items-center justify-between py-5">
        <h2>{title}</h2>
        <ChevronIcon className="transition group-open:rotate-180" />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/fountain/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const all = await getProducts();
  const typeCategory = product.categories.find((c) => !c.isSeries);
  const related = all
    .filter((p) => p.id !== product.id)
    .filter((p) => p.categories.some((c) => product.categories.some((pc) => pc.slug === c.slug)))
    .slice(0, 4);

  // Structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: product.images.map((i) => i.src),
    description: product.summary,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav
        aria-label="Breadcrumb"
        className="eyebrow mb-8 flex flex-wrap items-center gap-2 text-[11px] text-muted"
      >
        <Link href="/" className="hover:text-teal">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop/" className="hover:text-teal">
          Fountains
        </Link>
        {typeCategory && (
          <>
            <span>/</span>
            <Link href={`/prod-category/${typeCategory.slug}/`} className="hover:text-teal">
              {typeCategory.name.replace(/^COOL DOG\s+/i, "")}
            </Link>
          </>
        )}
      </nav>

      <ProductView
        name={product.name}
        slug={product.slug}
        sku={product.sku}
        series={seriesOf(product)}
        summary={product.summary}
        price={product.price}
        regularPrice={product.regularPrice}
        priceLabel={product.priceLabel}
        inStock={product.inStock}
        images={product.images}
        variations={product.options}
      >
        <div className="border-t border-line">
          <Accordion title="Details & Features" open>
            <RichText value={product.description} className="text-[15px]" />
          </Accordion>
          <Accordion title="Colors">
            <p className="text-[15px] text-ink/80">
              Available in {product.colors.join(", ")}. Custom colors are available through our
              Color Play® program.
            </p>
            <Link
              href="/dog-water-fountain-colors/"
              className="link-underline mt-3 inline-block text-[15px]"
            >
              See all colors
            </Link>
          </Accordion>
          <Accordion title="Installation & Specs">
            <ul className="space-y-2 text-[15px]">
              {RESOURCE_LINKS.filter((l) => !/colors/i.test(l.label)).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Accordion>
        </div>
      </ProductView>

      {related.length > 0 && (
        <section className="mt-24 border-t border-line pt-16">
          <h2 className="headline text-5xl lg:text-6xl">You may also like</h2>
          <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16" aria-busy="true">
      <div className="aspect-square animate-pulse bg-mist lg:col-span-7" />
      <div className="space-y-4 lg:col-span-5">
        <div className="h-3 w-32 animate-pulse bg-mist" />
        <div className="h-24 animate-pulse bg-mist" />
        <div className="h-8 w-40 animate-pulse bg-mist" />
        <div className="h-12 animate-pulse bg-mist" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/fountain/[slug]">) {
  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 py-10 lg:px-8 lg:py-14">
        <Suspense fallback={<ProductSkeleton />}>
          <ProductDetails params={params} />
        </Suspense>
      </div>
      <QuoteCta />
    </>
  );
}
