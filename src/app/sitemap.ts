import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategories, getPages, getProducts } from "@/lib/content";

const absolute = (src: string) => (src.startsWith("http") ? src : `${SITE_URL}${src}`);

/** /sitemap.xml — every page, category and product, with their main images. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, products, categories] = await Promise.all([
    getPages(),
    getProducts(),
    getCategories(),
  ]);
  const contact = pages.find((p) => p.slug === "contact-us");

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop/`, changeFrequency: "weekly", priority: 0.9 },
    ...products
      .filter((p) => !p.seo.noindex)
      .map((p) => ({
        url: `${SITE_URL}/fountain/${p.slug}/`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
        images: p.images.slice(0, 10).map((i) => absolute(i.src)),
      })),
    ...categories
      .filter((c) => !c.seo.noindex)
      .map((c) => ({
        url: `${SITE_URL}/prod-category/${c.slug}/`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: c.image ? [absolute(c.image.src)] : undefined,
      })),
    {
      url: `${SITE_URL}/contact-us/`,
      lastModified: contact?.modified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...pages
      .filter((p) => p.slug !== "contact-us" && !p.seo.noindex)
      .map((p) => ({
        url: `${SITE_URL}/${p.slug}/`,
        lastModified: p.modified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        images: p.heroImage ? [absolute(p.heroImage)] : undefined,
      })),
  ];
}
