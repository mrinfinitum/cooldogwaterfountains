import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PageHero, { PageHeroSkeleton } from "@/components/PageHero";
import QuoteCta from "@/components/QuoteCta";
import WpContent from "@/components/WpContent";
import { wpPageMetadata } from "@/lib/seo";
import { RESERVED_PAGE_SLUGS, getPage, getPages } from "@/lib/wordpress";

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.filter((p) => !RESERVED_PAGE_SLUGS.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pages = await getPages();
  const page = RESERVED_PAGE_SLUGS.has(slug) ? undefined : pages.find((p) => p.slug === slug);
  if (!page) return {};
  const metadata = wpPageMetadata(page, pages);
  // Form confirmation page: keep it out of search results.
  return page.slug === "success"
    ? { ...metadata, robots: { index: false, follow: true } }
    : metadata;
}

// The site footer and the quote banner already carry this boilerplate.
const BOILERPLATE = /<p>[^<]*manufactured for easy installation[\s\S]*?<\/p>/gi;

async function WordPressPage({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const page = RESERVED_PAGE_SLUGS.has(slug) ? null : await getPage(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero eyebrow="Cool Dog Water Fountains" title={page.title} image={page.heroImage} />
      <article className="mx-auto max-w-4xl px-4 py-16 lg:py-24">
        <WpContent html={page.html.replace(BOILERPLATE, "")} />
      </article>
    </>
  );
}

export default function Page({ params }: PageProps<"/[slug]">) {
  return (
    <>
      <Suspense
        fallback={
          <>
            <PageHeroSkeleton />
            <div className="mx-auto h-96 max-w-3xl px-4 py-16" />
          </>
        }
      >
        <WordPressPage params={params} />
      </Suspense>
      <QuoteCta />
    </>
  );
}
