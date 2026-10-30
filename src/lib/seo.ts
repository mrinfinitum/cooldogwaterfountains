import type { Metadata } from "next";
import { toPlainText, type PortableTextBlock } from "next-sanity";
import { formatPrice } from "./format";
import { SITE_NAME, SITE_URL } from "./site";
import type { Page, Product, ProductCategory } from "./content";

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
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
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
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

const shortName = (name: string) =>
  name
    .replace(/^COOL DOG\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

/** First paragraph of rich text with real sentence content. */
function firstParagraph(blocks: PortableTextBlock[]): string | undefined {
  for (const block of blocks) {
    if (block._type !== "block" || (block.style && block.style !== "normal")) continue;
    const text = toPlainText([block]).trim();
    if (text.length >= 60 && /[a-z]{3}/.test(text)) return text;
  }
  return undefined;
}

export function productMetadata(product: Product): Metadata {
  const name = shortName(product.name);
  const colors = product.colors.length;
  const generated = `${name}: ${formatPrice(product.price)} contractor price${
    colors ? `, ${colors} ${colors === 1 ? "color" : "colors"}` : ""
  }. Made in the USA for dog parks, apartments and HOAs.`;
  return buildMetadata({
    title: product.seo.title || `${name} | ${SITE_NAME}`,
    description: product.seo.description || generated,
    path: `/fountain/${product.slug}/`,
    image: product.images[0]?.src,
    noindex: product.seo.noindex,
  });
}

export function categoryMetadata(category: ProductCategory, productCount: number): Metadata {
  const name = shortName(category.name);
  const generated = `Shop ${name} dog water fountains: ${productCount} ${
    productCount === 1 ? "model" : "models"
  } with contractor pricing for dog parks, apartments, HOAs and vet clinics.`;
  return buildMetadata({
    title: category.seo.title || `${name} | ${SITE_NAME}`,
    description:
      category.seo.description ||
      (category.description.length >= DESC_MIN ? category.description : generated),
    path: `/prod-category/${category.slug}/`,
    image: category.image?.src,
    noindex: category.seo.noindex,
  });
}

/** A content page: its SEO fields from Sanity, or ones built from its content. */
export function pageMetadata(
  page: Pick<Page, "title" | "slug" | "body" | "heroImage" | "seo">,
  options: { path?: string; description?: string } = {},
): Metadata {
  return buildMetadata({
    title: page.seo.title || `${page.title} | ${SITE_NAME}`,
    description:
      page.seo.description ||
      options.description ||
      firstParagraph(page.body) ||
      `${page.title} – ${TAGLINE}`,
    path: options.path ?? `/${page.slug}/`,
    image: page.heroImage,
    noindex: page.seo.noindex,
  });
}
