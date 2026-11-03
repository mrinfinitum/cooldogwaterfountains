import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";
import QuoteCta from "@/components/QuoteCta";
import { buildMetadata } from "@/lib/seo";
import { getProducts } from "@/lib/content";

export const metadata: Metadata = buildMetadata({
  title: "Shop Dog Water Fountains | Cool Dog Water Fountains",
  description:
    "Shop Fresh Flow push-button and portable dog water fountains and the Cool Dog rinse station for dog parks, apartments and HOAs. Made in the USA.",
  path: "/shop/",
  image: "/media/cool-dog-water-fountains-header.jpg",
});

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <>
      <PageHero
        eyebrow={`${products.length} fountains · Contractor pricing`}
        title="Shop all fountains"
      />
      <div className="mx-auto max-w-[1600px] px-4 py-12 lg:px-8 lg:py-16">
        <h2 className="sr-only">All dog water fountains</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 3} />
          ))}
        </div>
      </div>
      <QuoteCta />
    </>
  );
}
