import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/site";
import { getPages, getProducts } from "@/lib/content";

const absolute = (src: string) => (src.startsWith("http") ? src : `${CANONICAL_URL}${src}`);

/** /sitemap.xml — every page and product (canonical URLs), with their main images. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, products] = await Promise.all([getPages(), getProducts()]);
  const contact = pages.find((p) => p.slug === "contact-us");

  return [
    { url: `${CANONICAL_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${CANONICAL_URL}/shop/`, changeFrequency: "weekly", priority: 0.9 },
    ...products
      .filter((p) => !p.seo.noindex)
      .map((p) => ({
        url: `${CANONICAL_URL}/fountain/${p.slug}/`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
        images: p.images.slice(0, 10).map((i) => absolute(i.src)),
      })),
    {
      url: `${CANONICAL_URL}/contact-us/`,
      lastModified: contact?.modified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...pages
      .filter((p) => p.slug !== "contact-us" && !p.seo.noindex)
      .map((p) => ({
        url: `${CANONICAL_URL}/${p.slug}/`,
        lastModified: p.modified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        images: p.heroImage ? [absolute(p.heroImage)] : undefined,
      })),
  ];
}
