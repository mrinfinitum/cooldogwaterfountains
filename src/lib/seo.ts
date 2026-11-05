import type { Metadata } from "next";
import { formatPrice } from "./format";
import { SITE_NAME, SITE_URL, canonicalUrl } from "./site";
import type { Page, Product } from "./content";
import { shortName } from "./format";

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
  const url = canonicalUrl(path);
  return {
    title: { absolute: t },
    description: d,
    // A noindex page gets no canonical: the two would send search engines mixed signals.
    ...(noindex ? {} : { alternates: { canonical: url } }),
    openGraph: {
      title: t,
      description: d,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: t, description: d, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** HTML to plain text (tags dropped, common entities decoded). */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#"
        ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1))
        : (ENTITIES[e.toLowerCase()] ?? m),
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** First paragraph of rich text with real sentence content. */
export function firstParagraph(html: string): string | undefined {
  for (const [, inner] of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = plainText(inner);
    if (text.length >= 60 && /[a-z]{3}/.test(text)) return text;
  }
  return undefined;
}

/** The first few bullet points of rich text (short ones only), for a product's key highlights. */
export function highlights(html: string, count = 4, colors: string[] = []): string[] {
  const colorNames = colors.map((c) => c.toLowerCase().replace(/\s*\(.*\)$/, ""));
  const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(([, inner]) => plainText(inner))
    .filter((text) => text.length >= 12 && text.length <= 90)
    // Not colour or option lists ("Green (GRN)", "Stainless Steel (SLV)").
    .filter((text) => !/\([A-Z]{2,5}\)\s*$/.test(text) && !colorNames.includes(text.toLowerCase()));
  return [...new Set(items)].slice(0, count);
}

/** Text compared ignoring tags, case, spacing and punctuation. */
const sameText = (html: string) => plainText(html).toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * The main description for "Details & features", minus what the product page
 * already shows above it: the summary paragraph, the key highlights, a short
 * "N year warranty" line and the "… sold separately" line. The CMS text is
 * left as it is; this only changes what's rendered. A list emptied this way
 * is dropped, with the heading right before it.
 */
export function withoutRepeats(
  html: string,
  page: { summary?: string; highlights: string[]; warranty?: string; soldSeparately?: string },
): string {
  const summary = page.summary ? sameText(page.summary) : "";
  const highlighted = new Set(page.highlights.map(sameText));
  const sold = page.soldSeparately ? sameText(page.soldSeparately) : "";

  return html
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>\s*/gi, (match, inner: string) => {
      const text = plainText(inner);
      const same = sameText(inner);
      if (summary && same === summary) return "";
      if (page.warranty && text.length < 40 && /^\W*(\d+|one|two|three|four|five|ten)[\s-]*(?:year|yr)s?\s+warranty\W*$/i.test(text)) return "";
      if (sold && /sold separately\W*$/i.test(text) && same.startsWith(sold)) return "";
      return match;
    })
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>\s*/gi, (match, inner: string) => (highlighted.has(sameText(inner)) ? "" : match))
    .replace(/(?:<h([2-6])\b[^>]*>(?:(?!<\/?h[2-6])[\s\S])*?<\/h\1>\s*)?<(ul|ol)\b[^>]*>\s*<\/\2>\s*/gi, "");
}

/** Warranty and "sold separately" notes from a product description, for its key facts. */
export function productFacts(html: string): { warranty?: string; soldSeparately?: string } {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(([, inner]) => plainText(inner));
  const WORDS: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", ten: "10" };
  const found = plainText(html).match(/\b(\d+|one|two|three|four|five|ten)[\s-]*(?:year|yr)s?(?:\s+\w+)?\s+warranty/i)?.[1];
  const years = found ? (WORDS[found.toLowerCase()] ?? found) : undefined;
  const separately = paragraphs
    .find((p) => /sold separately/i.test(p) && p.length < 160)
    ?.replace(/\s*(?:are|is)?\s*sold separately\.?\s*$/i, "");
  return {
    ...(years ? { warranty: `${years} ${years === "1" ? "year" : "years"}` } : {}),
    ...(separately ? { soldSeparately: separately } : {}),
  };
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

/** A content page: its SEO fields from the CMS, or ones built from its content. */
export function pageMetadata(
  page: Pick<Page, "title" | "slug" | "html" | "heroImage" | "seo">,
  options: { path?: string; description?: string } = {},
): Metadata {
  return buildMetadata({
    title: page.seo.title || `${page.title} | ${SITE_NAME}`,
    description:
      page.seo.description ||
      options.description ||
      firstParagraph(page.html) ||
      `${page.title} – ${TAGLINE}`,
    path: options.path ?? `/${page.slug}/`,
    image: page.heroImage,
    noindex: page.seo.noindex,
  });
}
