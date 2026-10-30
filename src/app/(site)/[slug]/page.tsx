import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PageHero, { PageHeroSkeleton } from "@/components/PageHero";
import QuoteCta from "@/components/QuoteCta";
import RichText from "@/components/RichText";
import { RESERVED_PAGE_SLUGS, getPage, getPages } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.filter((p) => !RESERVED_PAGE_SLUGS.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = RESERVED_PAGE_SLUGS.has(slug) ? null : await getPage(slug);
  return page ? pageMetadata(page) : {};
}

async function ContentPage({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const page = RESERVED_PAGE_SLUGS.has(slug) ? null : await getPage(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero eyebrow="Cool Dog Water Fountains" title={page.title} image={page.heroImage} />
      <article className="mx-auto max-w-4xl px-4 py-16 lg:py-24">
        <RichText value={page.body} />
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
        <ContentPage params={params} />
      </Suspense>
      <QuoteCta />
    </>
  );
}
