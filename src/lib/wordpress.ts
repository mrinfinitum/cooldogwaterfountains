import { cacheLife, cacheTag } from "next/cache";
import studioPhotos from "@/data/studio-photos.json";
import { photoMatchesColor } from "./colors";
import { diviBlurbs, diviHeroImage } from "./divi";
import { cleanWpHtml, decodeEntities, toLocalHref, toPlainText, toWpMediaUrl } from "./html";
import { WP_URL } from "./site";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Seo = {
  title?: string;
  description?: string;
  image?: string;
};

export type WpPage = {
  id: number;
  slug: string;
  title: string;
  html: string;
  /** Banner photo from the page's first Divi section, if it is hosted on WordPress. */
  heroImage?: string;
  modified: string;
  seo: Seo;
};

export type ProductImage = { src: string; alt: string };

/** One color option of a product (a WooCommerce variation). */
export type ColorOption = {
  id: number;
  color: string;
  price: number;
  regularPrice: number;
  /** The fountain photographed in this color (or its paint chip if there is no photo). */
  image?: ProductImage;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  sku: string;
  summary: string;
  descriptionHtml: string;
  price: number;
  regularPrice: number;
  onSale: boolean;
  priceLabel?: string;
  inStock: boolean;
  images: ProductImage[];
  categories: { slug: string; name: string }[];
  colors: string[];
  options: ColorOption[];
};

/** A product-line card from the WordPress homepage ("Shop by fountain"). */
export type ProductLine = {
  title: string;
  subtitle: string;
  image?: ProductImage;
  href: string;
};

export type ProductCategory = {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
  image?: ProductImage;
};

/* ------------------------------------------------------------------ */
/* Raw API shapes (only the fields we use)                             */
/* ------------------------------------------------------------------ */

type RawYoast = {
  title?: string;
  description?: string;
  og_description?: string;
  og_image?: { url: string }[];
};

type RawPage = {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  modified: string;
  yoast_head_json?: RawYoast;
};

type RawImage = { src: string; alt?: string; name?: string };

type RawPrices = {
  price: string;
  regular_price: string;
  currency_minor_unit: number;
};

type RawProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: RawPrices;
  price_html: string;
  is_in_stock: boolean;
  images: RawImage[];
  categories: { slug: string; name: string }[];
  attributes: { name: string; terms: { name: string }[] }[];
  variations: { id: number; attributes: { name: string; value: string }[] }[];
};

type RawVariation = RawProduct & { parent: number; variation?: string };

type RawCategory = {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
  image: RawImage | null;
};

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch every page of a WordPress REST collection.
 * Retries when WordPress rate-limits or hiccups, and throws if it still
 * fails, so a temporary outage never gets cached as "no content".
 */
async function wpFetchAll<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const separator = path.includes("?") ? "&" : "?";
    const res = await fetchWithRetry(
      `${WP_URL}/wp-json/${path}${separator}per_page=100&page=${page}`,
    );
    results.push(...((await res.json()) as T[]));
    totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1);
    page += 1;
  } while (page <= totalPages);
  return results;
}

async function fetchWithRetry(url: string, attempts = 6): Promise<Response> {
  let lastError = "";
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return res;
      lastError = `HTTP ${res.status}`;
      if (res.status !== 429 && res.status < 500) break;
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = retryAfter > 0 ? Math.min(retryAfter * 1000, 15_000) : 500 * 2 ** attempt;
      await sleep(wait + Math.random() * 250);
    } catch (error) {
      lastError = String(error);
      await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error(`WordPress request failed (${lastError}): ${url}`);
}

const toMinor = (value: string, minorUnit: number) =>
  Math.round((Number(value) || 0) * 10 ** (2 - minorUnit));

// Studio versions of product photos, built by `npm run photos`.
// Keyed by the path under /wp-content/uploads/ so lookups keep working when
// WordPress moves to another domain.
const uploadsPath = (url: string) => url.split("/wp-content/uploads/")[1] ?? url;
const STUDIO: Record<string, string> = Object.fromEntries(
  Object.entries(studioPhotos as Record<string, string>).map(([url, file]) => [
    uploadsPath(url),
    file,
  ]),
);
const studioFor = (url: string): string | undefined => STUDIO[uploadsPath(url)];

/** Uses the studio version of a photo when one has been rendered. */
const mapImage = (img: RawImage, fallbackAlt: string): ProductImage => ({
  src: studioFor(img.src) ?? toWpMediaUrl(img.src),
  alt: decodeEntities(img.alt || fallbackAlt),
});

/**
 * The best photo of a product in one color: the color option's own photo if
 * it shows the fountain, otherwise a gallery photo named for that color
 * (studio versions first), otherwise the option's paint-chip image.
 */
function colorPhoto(color: string, own: RawImage | undefined, gallery: RawImage[], name: string) {
  const alt = `${name} – ${color}`;
  if (own && studioFor(own.src)) return mapImage(own, alt);
  const matches = gallery.filter((img) => photoMatchesColor(img.src, color));
  const best = matches.find((img) => studioFor(img.src)) ?? matches[0];
  if (best) return mapImage(best, alt);
  return own ? mapImage(own, alt) : undefined;
}

const mapSeo = (yoast: RawYoast | undefined): Seo => {
  const description = yoast?.description ?? yoast?.og_description;
  return {
    title: yoast?.title ? decodeEntities(yoast.title) : undefined,
    description: description ? toPlainText(description) : undefined,
    image: yoast?.og_image?.[0]?.url,
  };
};

function mapPage(raw: RawPage): WpPage {
  const hero = diviHeroImage(raw.content.rendered);
  return {
    id: raw.id,
    slug: raw.slug,
    title: decodeEntities(raw.title.rendered),
    html: cleanWpHtml(raw.content.rendered),
    heroImage:
      hero &&
      /\/wp-content\/uploads\//.test(toWpMediaUrl(hero)) &&
      toWpMediaUrl(hero).startsWith(WP_URL)
        ? toWpMediaUrl(hero)
        : undefined,
    modified: raw.modified,
    seo: mapSeo(raw.yoast_head_json),
  };
}

function mapProduct(raw: RawProduct, variations: RawVariation[]): Product {
  const name = decodeEntities(raw.name);
  const colorAttr = raw.attributes.find((a) => /colou?r/i.test(a.name));
  const label = raw.price_html.match(/class="pre-price">([^<]+)</)?.[1];
  const byId = new Map(variations.map((v) => [v.id, v]));

  const options = raw.variations.flatMap(({ id, attributes }): ColorOption[] => {
    const v = byId.get(id);
    if (!v) return [];
    const color = decodeEntities(attributes.find((a) => /colou?r/i.test(a.name))?.value ?? "");
    return [
      {
        id,
        color,
        price: toMinor(v.prices.price, v.prices.currency_minor_unit),
        regularPrice: toMinor(v.prices.regular_price, v.prices.currency_minor_unit),
        image: colorPhoto(color, v.images[0], raw.images, name),
      },
    ];
  });

  return {
    id: raw.id,
    slug: raw.slug,
    name,
    sku: raw.sku,
    summary: toPlainText(raw.short_description),
    // Shown under the product's h1 inside "Details" (an h2), so it starts at h3.
    descriptionHtml: cleanWpHtml(raw.description, { images: false, topHeading: 3 }),
    price: toMinor(raw.prices.price, raw.prices.currency_minor_unit),
    regularPrice: toMinor(raw.prices.regular_price, raw.prices.currency_minor_unit),
    onSale: raw.on_sale,
    priceLabel: label ? decodeEntities(label).replace(/:\s*$/, "") : undefined,
    inStock: raw.is_in_stock,
    images: raw.images.map((img) => mapImage(img, name)),
    categories: raw.categories.map((c) => ({ slug: c.slug, name: decodeEntities(c.name) })),
    colors: colorAttr?.terms.map((t) => decodeEntities(t.name)) ?? [],
    options,
  };
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

// Pages handled elsewhere: WooCommerce screens, the front page, and
// routes with their own design.
export const RESERVED_PAGE_SLUGS = new Set([
  "cart",
  "checkout",
  "my-account",
  "dog-water-fountains",
  "contact-us",
]);

export async function getPages(): Promise<WpPage[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("wordpress", "pages");
  const raw = await wpFetchAll<RawPage>(
    "wp/v2/pages?status=publish&_fields=id,slug,title,content,modified,yoast_head_json",
  );
  return raw.map(mapPage);
}

export async function getPage(slug: string): Promise<WpPage | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/* Products (WooCommerce Store API — public, no keys needed)           */
/* ------------------------------------------------------------------ */

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("wordpress", "products");
  const [raw, variations] = await Promise.all([
    wpFetchAll<RawProduct>("wc/store/v1/products"),
    wpFetchAll<RawVariation>("wc/store/v1/products?type=variation"),
  ]);
  return raw.map((p) =>
    mapProduct(
      p,
      variations.filter((v) => v.parent === p.id),
    ),
  );
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getCategories(): Promise<ProductCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("wordpress", "products");
  const raw = await wpFetchAll<RawCategory>("wc/store/v1/products/categories");
  return raw
    .filter((c) => c.count > 0 && c.slug !== "uncategorized")
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: decodeEntities(c.name),
      description: toPlainText(c.description),
      count: c.count,
      image: c.image ? mapImage(c.image, decodeEntities(c.name)) : undefined,
    }));
}

/** Yoast SEO fields for every product or product category, keyed by slug. */
async function getSeoMap(type: "product" | "product_cat"): Promise<Record<string, Seo>> {
  "use cache";
  cacheLife("hours");
  cacheTag("wordpress", "seo");
  const raw = await wpFetchAll<{ slug: string; yoast_head_json?: RawYoast }>(
    `wp/v2/${type}?_fields=slug,yoast_head_json`,
  );
  return Object.fromEntries(raw.map((item) => [item.slug, mapSeo(item.yoast_head_json)]));
}

/** Yoast SEO fields for every product or category (to spot duplicates). */
export async function getAllSeo(type: "product" | "product_cat"): Promise<Seo[]> {
  return Object.values(await getSeoMap(type));
}

export async function getSeo(type: "product" | "product_cat", slug: string): Promise<Seo> {
  const map = await getSeoMap(type);
  return map[slug] ?? {};
}

/* ------------------------------------------------------------------ */
/* Homepage product lines                                              */
/* ------------------------------------------------------------------ */

const words = (text: string) =>
  new Set(
    decodeEntities(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && w !== "cool" && w !== "dog")
      .map((w) => w.replace(/s$/, "")),
  );

/** The category whose name best matches a card's title and subtitle. */
function closestCategory(text: string, categories: ProductCategory[]) {
  const target = words(text);
  let best: { slug: string; score: number } | undefined;
  for (const c of categories) {
    const name = words(c.name);
    const shared = [...name].filter((w) => target.has(w)).length;
    const score = shared / new Set([...name, ...target]).size;
    if (!best || score > best.score) best = { slug: c.slug, score };
  }
  return best && best.score >= 0.3 ? best.slug : undefined;
}

/**
 * The "Dog Water Fountains" product-line grid on the WordPress homepage:
 * one card per line, with its photo, title and short subtitle. Cards link to
 * the matching product category.
 */
export async function getProductLines(): Promise<ProductLine[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("wordpress", "pages");
  const [front, categories] = await Promise.all([
    wpFetchAll<{ content: { rendered: string } }>(
      "wp/v2/pages?slug=dog-water-fountains&_fields=content",
    ),
    getCategories(),
  ]);
  const blurbs = diviBlurbs(front[0]?.content.rendered ?? "");

  return blurbs
    .filter((b) => b.title && b.image)
    .map((b) => {
      const title = decodeEntities(b.title!).replace(/^COOL DOG\s+/i, "");
      const subtitle = toPlainText(b.content);
      const slug = closestCategory(`${title} ${subtitle}`, categories);
      const href = slug
        ? `/prod-category/${slug}/`
        : b.link && !b.link.startsWith("@ET-DC@")
          ? toLocalHref(b.link)
          : "/shop/";
      return { title, subtitle, image: mapImage({ src: b.image!, alt: b.alt }, title), href };
    });
}
