import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CategoryNav from "@/components/CategoryNav";
import PageHero, { PageHeroSkeleton } from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";
import QuoteCta from "@/components/QuoteCta";
import { categoryMetadata } from "@/lib/seo";
import { getCategories, getProducts } from "@/lib/content";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/prod-category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const count = products.filter((p) => p.categories.some((c) => c.slug === slug)).length;
  return categoryMetadata(category, count);
}

async function CategoryContent({ params }: Pick<PageProps<"/prod-category/[slug]">, "params">) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const items = products.filter((p) => p.categories.some((c) => c.slug === slug));

  return (
    <>
      <PageHero
        eyebrow={`${items.length} ${items.length === 1 ? "fountain" : "fountains"}`}
        title={category.name.replace(/^COOL DOG\s+/i, "")}
      >
        {category.description && (
          <p className="mt-6 max-w-2xl whitespace-pre-line text-lg text-white/85">
            {category.description}
          </p>
        )}
      </PageHero>
      <div className="mx-auto max-w-[1600px] px-4 py-12 lg:px-8 lg:py-16">
        <CategoryNav categories={categories} active={slug} />
        <h2 className="sr-only">{category.name.replace(/^COOL DOG\s+/i, "")} models</h2>
        <div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </div>
    </>
  );
}

export default function CategoryPage({ params }: PageProps<"/prod-category/[slug]">) {
  return (
    <>
      <Suspense fallback={<PageHeroSkeleton />}>
        <CategoryContent params={params} />
      </Suspense>
      <QuoteCta />
    </>
  );
}
