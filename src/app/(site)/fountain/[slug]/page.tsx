import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { seriesOf, shortName } from "@/lib/format";
import { swatchColor } from "@/lib/colors";
import ProductDownloads from "@/components/ProductDownloads";
import ProductView from "@/components/ProductView";
import QuoteCta from "@/components/QuoteCta";
import RichText from "@/components/RichText";
import { SITE_NAME, canonicalUrl } from "@/lib/site";
import PlanningList from "@/components/sheets/PlanningList";
import { SHEETS, isAttached } from "@/lib/sheets";
import { productMetadata, withoutRepeats } from "@/lib/seo";
import { getProduct, getProducts } from "@/lib/content";

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


async function ProductDetails({ params }: Pick<PageProps<"/fountain/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);
  const series = seriesOf(product.sku);
  const facts = product.page;
  const sheetsNotAttached = SHEETS.filter((s) => !isAttached(s, product.downloads));

  // Structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    url: canonicalUrl(`/fountain/${product.slug}/`),
    name: product.name,
    sku: product.sku,
    image: product.images.map((i) => i.src),
    description: product.summary,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: canonicalUrl(`/fountain/${product.slug}/`),
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
      </nav>

      <ProductView
        name={product.name}
        slug={product.slug}
        sku={product.sku}
        series={series}
        lead={product.page.summary}
        highlights={product.page.highlights}
        price={product.price}
        regularPrice={product.regularPrice}
        priceLabel={product.priceLabel}
        inStock={product.inStock}
        images={product.images}
        variations={product.options}
      />

      {/* Details: the full description, with the key facts, downloads and resources beside it */}
      <section className="mt-20 grid grid-cols-1 gap-12 border-t border-line pt-14 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-7">
          <p className="eyebrow text-teal">Details &amp; features</p>
          <h2 className="headline mt-3 text-4xl lg:text-5xl">{shortName(product.name)}</h2>
          {/* What the summary, highlights and At a glance already show is left out here. */}
          <RichText html={withoutRepeats(product.descriptionHtml, product.page)} className="mt-8 max-w-[68ch]" />
        </div>

        <aside className="lg:col-span-5">
          <div className="space-y-8 bg-mist p-7 lg:sticky lg:top-28">
            <div>
              <h2 className="eyebrow">At a glance</h2>
              <dl className="mt-4 divide-y divide-line text-[15px]">
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted">SKU</dt>
                  <dd className="font-medium">{product.sku}</dd>
                </div>
                {series && (
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Series</dt>
                    <dd className="font-medium">{series}</dd>
                  </div>
                )}
                {product.options.length > 0 && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-muted">Colors</dt>
                    <dd className="flex items-center gap-1.5">
                      {product.options.map((o) => (
                        <span
                          key={o.id}
                          title={o.color}
                          className="size-4 rounded-full border border-black/15"
                          style={{ background: o.swatch ?? swatchColor(o.color) }}
                        />
                      ))}
                    </dd>
                  </div>
                )}
                {facts.warranty && (
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Warranty</dt>
                    <dd className="font-medium">{facts.warranty}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted">Made in</dt>
                  <dd className="font-medium">{facts.madeIn}</dd>
                </div>
              </dl>
              {facts.soldSeparately && (
                <p className="mt-4 text-sm leading-relaxed text-body">
                  <span className="font-semibold text-ink">Sold separately: </span>
                  {facts.soldSeparately}
                </p>
              )}
            </div>

            <div>
              <h2 className="eyebrow">Planning &amp; installation</h2>
              {/* The files attached to this product in the CMS (Downloads box), with their labels. */}
              {product.downloads.length > 0 && <ProductDownloads downloads={product.downloads} />}
              {/* Site-wide planning sheets this product doesn't have attached yet. */}
              {sheetsNotAttached.length > 0 && (
                // Right under the downloads it continues the same list (no second gap or border).
                <div className={product.downloads.length > 0 ? "[&>ul]:mt-0 [&>ul]:border-t-0" : undefined}>
                  <PlanningList sheets={sheetsNotAttached} />
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

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
