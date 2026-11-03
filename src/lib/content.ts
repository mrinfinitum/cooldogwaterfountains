import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cms } from "./cms";

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
  taxCode: string;
  seo: Seo;
};

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
    taxCode: p.taxCode,
    seo: p.seo,
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

export async function getPages(): Promise<Page[]> {
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
