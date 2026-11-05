import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cms } from "./cms";
import { firstParagraph, highlights, productFacts } from "./seo";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Seo = {
  title?: string;
  description?: string;
  focusKeyphrase?: string;
  noindex?: boolean;
};

export type ProductImage = { src: string; alt: string };

/** One color option of a product. */
export type ColorOption = {
  id: string;
  color: string;
  /** This color's SKU (the product SKU when none is set). */
  sku: string;
  swatch?: string;
  /** Prices in cents: Contractor Price (what the shopper pays) and Commercial List Price. */
  price: number;
  regularPrice: number;
  inStock: boolean;
  /** The fountain photographed in this color. */
  image?: ProductImage;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  summary: string;
  /** Rendered HTML from the CMS. */
  descriptionHtml: string;
  /** Prices in cents: Contractor Price (what the shopper pays) and Commercial List Price. */
  price: number;
  regularPrice: number;
  onSale: boolean;
  priceLabel?: string;
  inStock: boolean;
  images: ProductImage[];
  categories: { slug: string; name: string; isSeries: boolean }[];
  colors: string[];
  options: ColorOption[];
  /** Spec sheets, CAD drawings and guides uploaded in the CMS. */
  downloads: Download[];
  /** What the product page shows beside the gallery and in "At a glance". */
  page: ProductPage;
  taxCode: string;
  seo: Seo;
};

/**
 * The product page's summary, highlights and key facts: from the CMS
 * "Product page" box, or (for any field left empty) read from the main
 * description as before.
 */
export type ProductPage = {
  summary?: string;
  highlights: string[];
  warranty?: string;
  soldSeparately?: string;
  madeIn: string;
};

export type Download = { label: string; url: string; filename: string; type: string; size: number | null };

export type Page = {
  id: string;
  slug: string;
  title: string;
  /** Rendered HTML from the CMS. */
  html: string;
  heroImage?: string;
  modified: string;
  seo: Seo;
};

/* ------------------------------------------------------------------ */
/* Headless Commerce CMS API (WordPress + WooCommerce)                 */
/* ------------------------------------------------------------------ */

type RawImage = { src: string; alt: string; width: number | null; height: number | null } | null;

type RawProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  summary: string;
  descriptionHtml: string;
  /** Cents. */
  listPrice: number | null;
  contractorPrice: number | null;
  price: number | null;
  priceLabel: string | null;
  inStock: boolean;
  images: RawImage[];
  categories: { slug: string; name: string; isSeries: boolean }[];
  attributes: { slug: string; values: { name: string; swatch: string | null }[] }[];
  options: {
    id: string;
    sku: string;
    color: string | null;
    price: number | null;
    listPrice: number | null;
    inStock: boolean;
    image: RawImage;
  }[];
  downloads?: Download[];
  /** The CMS "Product page" box (plugin 0.11+); missing on older plugins. */
  page?: {
    summary?: string;
    highlights?: string[];
    warranty?: string;
    soldSeparately?: string;
    madeIn?: string;
  };
  taxCode: string;
  order: number;
  seo: Seo;
};

type RawPage = {
  id: string;
  slug: string;
  title: string;
  html: string;
  heroImage: RawImage;
  modified: string;
  seo: Seo;
};

const image = (img: RawImage | undefined, fallbackAlt: string): ProductImage | undefined =>
  img?.src ? { src: img.src, alt: img.alt || fallbackAlt } : undefined;

function mapProduct(p: RawProduct): Product {
  const price = p.price ?? 0;
  const regularPrice = Math.max(p.listPrice ?? price, price);
  const swatches = new Map(
    (p.attributes.find((a) => a.slug === "color")?.values ?? []).map((v) => [v.name, v.swatch]),
  );
  const options = p.options
    .filter((o) => o.color)
    .map((o) => {
      const optionPrice = o.price ?? price;
      return {
        id: o.id,
        color: o.color!,
        sku: o.sku || p.sku,
        swatch: swatches.get(o.color!) ?? undefined,
        price: optionPrice,
        regularPrice: Math.max(o.listPrice ?? optionPrice, optionPrice),
        inStock: o.inStock,
        image: image(o.image, `${p.name} – ${o.color}`),
      };
    });
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    summary: p.summary,
    descriptionHtml: p.descriptionHtml,
    price,
    regularPrice,
    onSale: regularPrice > price,
    priceLabel: p.priceLabel ?? undefined,
    inStock: p.inStock,
    images: p.images.flatMap((img) => image(img, p.name) ?? []),
    categories: p.categories,
    colors: options.map((o) => o.color),
    options,
    downloads: p.downloads ?? [],
    page: productPage(p, options.map((o) => o.color)),
    taxCode: p.taxCode,
    seo: p.seo,
  };
}

/** Each CMS "Product page" field, or what the main description gives when it's empty. */
function productPage(p: RawProduct, colors: string[]): ProductPage {
  const cms = p.page ?? {};
  const text = (value?: string) => value?.trim() || undefined;
  const listed = (cms.highlights ?? []).map((h) => h.trim()).filter(Boolean);
  const facts = productFacts(p.descriptionHtml);
  return {
    summary: text(cms.summary) ?? firstParagraph(p.descriptionHtml),
    highlights: listed.length ? listed.slice(0, 4) : highlights(p.descriptionHtml, 4, colors),
    warranty: text(cms.warranty) ?? facts.warranty,
    soldSeparately: text(cms.soldSeparately) ?? facts.soldSeparately,
    madeIn: text(cms.madeIn) ?? "USA",
  };
}

const byOrderThenName = (a: { order: number; name: string }, b: { order: number; name: string }) =>
  a.order - b.order || a.name.localeCompare(b.name);

/* ------------------------------------------------------------------ */
/* Data access (cached; refreshed when the CMS posts to /api/revalidate) */
/* ------------------------------------------------------------------ */

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cms", "products");
  const raw = await cms<RawProduct[]>("products");
  return raw.sort(byOrderThenName).map(mapProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Pages with their own routes rather than the generic page template. */
export const RESERVED_PAGE_SLUGS = new Set(["contact-us"]);

/**
 * Pages that are no longer pages on the site: their content now opens as an
 * overlay sheet (with a PDF download) from product pages and the menus, or
 * they are unused. Their old addresses redirect (next.config.ts).
 */
export const RETIRED_PAGE_SLUGS = new Set([
  "dog-water-fountain-colors",
  "dog-water-fountain-plumbing",
  "installation-fresh-flow-fountains",
  "dog-water-fountain-resources",
  "success",
]);

/** The site's pages (retired ones excluded). */
export async function getPages(): Promise<Page[]> {
  return (await getAllPages()).filter((p) => !RETIRED_PAGE_SLUGS.has(p.slug));
}

/** Every published CMS page, including those shown only as sheets. */
export async function getAllPages(): Promise<Page[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cms", "pages");
  const raw = await cms<RawPage[]>("pages");
  return raw.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    html: p.html,
    heroImage: p.heroImage?.src,
    modified: p.modified,
    seo: p.seo,
  }));
}

export async function getPage(slug: string): Promise<Page | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}
