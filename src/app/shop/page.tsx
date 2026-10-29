import type { Metadata } from "next";
import CategoryNav from "@/components/CategoryNav";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";
import QuoteCta from "@/components/QuoteCta";
import { buildMetadata } from "@/lib/seo";
import { getCategories, getProducts } from "@/lib/wordpress";

export const metadata: Metadata = buildMetadata({
  title: "Shop Dog Water Fountains | Cool Dog Water Fountains",
  description:
    "Shop Cool Dog and Fresh Flow dog water fountains, rinse stations and bottle fillers for dog parks, apartments and HOAs. Contractor pricing, made in the USA.",
  path: "/shop/",
  image: "/studio/2026-04-dl-1000-dd-slv-bonewhite.jpg",
});

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <PageHero
        eyebrow={`${products.length} fountains · Contractor pricing`}
        title="Shop all fountains"
      />
      <div className="mx-auto max-w-[1600px] px-4 py-12 lg:px-8 lg:py-16">
        <CategoryNav categories={categories} />
        <h2 className="sr-only">All dog water fountains</h2>
        <div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </div>
      <QuoteCta />
    </>
  );
}
