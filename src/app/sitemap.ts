import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { RESERVED_PAGE_SLUGS, getCategories, getPages, getProducts } from "@/lib/wordpress";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, products, categories] = await Promise.all([
    getPages(),
    getProducts(),
    getCategories(),
  ]);

  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/shop/`, priority: 0.9 },
    { url: `${SITE_URL}/contact-us/`, priority: 0.8 },
    ...categories.map((c) => ({ url: `${SITE_URL}/prod-category/${c.slug}/`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/fountain/${p.slug}/`, priority: 0.9 })),
    ...pages
      .filter((p) => !RESERVED_PAGE_SLUGS.has(p.slug))
      .map((p) => ({ url: `${SITE_URL}/${p.slug}/`, lastModified: p.modified, priority: 0.6 })),
  ];
}
