import type { Metadata } from "next";
import { firstParagraph, formatPrice, toPlainText } from "./html";
import { SITE_NAME, SITE_URL } from "./site";
import type { Product, ProductCategory, Seo, WpPage } from "./wordpress";

const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const TAGLINE = "Commercial dog water fountains, made in the USA with contractor pricing.";

/** Shorten "A | B | C" titles by dropping trailing segments until they fit. */
export function fitTitle(title: string): string {
  let parts = title
    .replace(/\s+/g, " ")
    .split(/\s+\|\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  while (parts.length > 1 && parts.join(" | ").length > TITLE_MAX) parts = parts.slice(0, -1);
  const joined = parts.join(" | ");
  // A single long name (e.g. a product) stays whole up to ~75 characters
  // rather than being cut mid-word; search engines shorten it on display.
  const limit = parts.length === 1 ? 75 : TITLE_MAX;
  return joined.length > limit ? `${joined.slice(0, limit - 1).replace(/\s+\S*$/, "")}…` : joined;
}

/** Keep descriptions between ~70 and 160 characters, ending on a whole word. */
export function fitDescription(text: string): string {
  let d = text.replace(/\s+/g, " ").trim();
  if (d.length < DESC_MIN) d = `${d}${d && !/[.!?]$/.test(d) ? "." : ""} ${TAGLINE}`.trim();
  if (d.length > DESC_MAX) d = `${d.slice(0, DESC_MAX - 1).replace(/[\s,;:–-]+\S*$/, "")}…`;
  return d;
}

const absolute = (src: string) => (src.startsWith("http") ? src : `${SITE_URL}${src}`);

/** Title, description, canonical URL and social-sharing tags for a page. */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const t = fitTitle(title);
  const d = fitDescription(description);
  const images = image ? [{ url: absolute(image) }] : undefined;
  return {
    title: { absolute: t },
    description: d,
    alternates: { canonical: path },
    openGraph: {
      title: t,
      description: d,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: t, description: d, images },
  };
}

const shortName = (name: string) =>
  name
    .replace(/^COOL DOG\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

/** Yoast values that are missing, WordPress defaults ("… Archives"), or shared with other items. */
const usable = (value: string | undefined, all: (string | undefined)[]) =>
  value && !/\barchives\b/i.test(value) && all.filter((v) => v === value).length === 1
    ? value
    : undefined;

/**
 * Like `usable`, but also rejects templated descriptions: "Name | tagline"
 * patterns, or ones ending with the same sentence as several others.
 */
const usableDescription = (value: string | undefined, all: (string | undefined)[]) => {
  const ok = usable(value, all);
  if (!ok || /\s\|\s/.test(ok)) return undefined;
  const ending = ok.slice(-45);
  return all.filter((v) => v?.endsWith(ending)).length > 1 ? undefined : ok;
};

const titlesOf = (all: Seo[]) => all.map((s) => s.title);
const descriptionsOf = (all: Seo[]) => all.map((s) => s.description);

export function productMetadata(product: Product, seo: Seo, allSeo: Seo[]): Metadata {
  const name = shortName(product.name);
  const colors = product.colors.length;
  const generated = `${name}: ${formatPrice(product.price)} contractor price${
    colors ? `, ${colors} ${colors === 1 ? "color" : "colors"}` : ""
  }. Made in the USA for dog parks, apartments and HOAs.`;
  return buildMetadata({
    title: usable(seo.title, titlesOf(allSeo)) ?? `${name} | ${SITE_NAME}`,
    description: usableDescription(seo.description, descriptionsOf(allSeo)) ?? generated,
    path: `/fountain/${product.slug}/`,
    image: product.images[0]?.src,
  });
}

export function categoryMetadata(
  category: ProductCategory,
  productCount: number,
  seo: Seo,
  allSeo: Seo[],
): Metadata {
  const name = shortName(category.name);
  const own = category.description.length >= DESC_MIN ? category.description : undefined;
  const generated = `Shop ${name} dog water fountains: ${productCount} ${
    productCount === 1 ? "model" : "models"
  } with contractor pricing for dog parks, apartments, HOAs and vet clinics.`;
  return buildMetadata({
    title: usable(seo.title, titlesOf(allSeo)) ?? `${name} | ${SITE_NAME}`,
    description: usableDescription(seo.description, descriptionsOf(allSeo)) ?? own ?? generated,
    path: `/prod-category/${category.slug}/`,
    image: category.image?.src,
  });
}

/**
 * A WordPress page: its Yoast title and description when they are specific to
 * the page, otherwise the page title and its first real paragraph.
 */
export function wpPageMetadata(
  page: WpPage,
  allPages: WpPage[],
  options: { path?: string; description?: string } = {},
): Metadata {
  const titles = allPages.map((p) => p.seo.title);
  const descriptions = allPages.map((p) => p.seo.description);
  return buildMetadata({
    title: usable(page.seo.title, titles) ?? `${page.title} | ${SITE_NAME}`,
    description:
      usableDescription(page.seo.description, descriptions) ??
      options.description ??
      firstParagraph(page.html) ??
      toPlainText(page.html, DESC_MAX),
    path: options.path ?? `/${page.slug}/`,
    image: page.seo.image ?? page.heroImage,
  });
}
