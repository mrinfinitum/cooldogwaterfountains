import { cacheLife, cacheTag } from "next/cache";
import { groq, type PortableTextBlock } from "next-sanity";
import { sanityClient } from "@/sanity/client";

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
  swatch?: string;
  /** Prices in cents. */
  price: number;
  regularPrice: number;
  /** The fountain photographed in this color. */
  image?: ProductImage;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  summary: string;
  description: PortableTextBlock[];
  /** Prices in cents. */
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

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  isSeries: boolean;
  count: number;
  image?: ProductImage;
  seo: Seo;
};

export type Page = {
  id: string;
  slug: string;
  title: string;
  body: PortableTextBlock[];
  heroImage?: string;
  modified: string;
  seo: Seo;
};

/** A card in the home page "Shop by fountain" grid. */
export type ProductLine = {
  title: string;
  subtitle: string;
  image?: ProductImage;
  href: string;
};

export type HomePage = { productLines: ProductLine[]; seo: Seo };

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

const IMAGE = `{ "src": asset->url, "alt": coalesce(alt, "") }`;

const PRODUCTS = groq`*[_type == "product" && defined(slug.current)] | order(order asc, name asc) {
  _id, name, "slug": slug.current, sku, price, compareAtPrice, priceLabel, inStock,
  summary, description, taxCode, seo,
  "images": images[] ${IMAGE},
  "categories": categories[]->{ name, "slug": slug.current, "isSeries": coalesce(isSeries, false) },
  "colors": colors[]{ _key, name, swatch, price, "image": image ${IMAGE} }
}`;

const CATEGORIES = groq`*[_type == "category" && defined(slug.current)] | order(order asc, name asc) {
  _id, name, "slug": slug.current, description, isSeries, seo,
  "image": image ${IMAGE},
  "count": count(*[_type == "product" && references(^._id)])
}`;

const PAGES = groq`*[_type == "page" && defined(slug.current)] {
  _id, title, "slug": slug.current, _updatedAt, seo,
  "heroImage": heroImage.asset->url,
  body[] {
    ...,
    _type == "image" => { ..., "src": asset->url, "dimensions": asset->metadata.dimensions },
    _type == "imageGrid" => { ..., images[] { ..., "src": asset->url, "dimensions": asset->metadata.dimensions } }
  }
}`;

const HOME = groq`*[_id == "homePage"][0] {
  seo,
  productLines[] { title, subtitle, "image": image ${IMAGE}, "slug": category->slug.current }
}`;

type RawImage = { src?: string; alt?: string } | null;
type RawProduct = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  priceLabel?: string;
  inStock?: boolean;
  summary?: string;
  description?: PortableTextBlock[];
  taxCode?: string;
  seo?: Seo;
  images?: RawImage[];
  categories?: { name: string; slug: string; isSeries: boolean }[] | null;
  colors?:
    { _key: string; name: string; swatch?: string; price?: number; image?: RawImage }[] | null;
};

const cents = (dollars: number | undefined) => Math.round((dollars ?? 0) * 100);
const image = (img: RawImage | undefined, fallbackAlt: string): ProductImage | undefined =>
  img?.src ? { src: img.src, alt: img.alt || fallbackAlt } : undefined;

function mapProduct(p: RawProduct): Product {
  const price = cents(p.price);
  const regularPrice = p.compareAtPrice ? cents(p.compareAtPrice) : price;
  return {
    id: p._id,
    slug: p.slug,
    name: p.name,
    sku: p.sku ?? "",
    summary: p.summary ?? "",
    description: p.description ?? [],
    price,
    regularPrice,
    onSale: regularPrice > price,
    priceLabel: p.priceLabel,
    inStock: p.inStock ?? true,
    images: (p.images ?? []).flatMap((img) => image(img, p.name) ?? []),
    categories: p.categories ?? [],
    colors: (p.colors ?? []).map((c) => c.name),
    options: (p.colors ?? []).map((c) => {
      const optionPrice = c.price != null ? cents(c.price) : price;
      return {
        id: c._key,
        color: c.name,
        swatch: c.swatch,
        price: optionPrice,
        regularPrice: c.price != null ? Math.max(optionPrice, regularPrice) : regularPrice,
        image: image(c.image, `${p.name} – ${c.name}`),
      };
    }),
    taxCode: p.taxCode || "txcd_99999999",
    seo: p.seo ?? {},
  };
}

/* ------------------------------------------------------------------ */
/* Data access (cached; refreshed when Sanity content is published)    */
/* ------------------------------------------------------------------ */

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("sanity", "products");
  const raw = await sanityClient.fetch<RawProduct[]>(PRODUCTS);
  return raw.map(mapProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getCategories(): Promise<ProductCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("sanity", "products");
  const raw = await sanityClient.fetch<
    {
      _id: string;
      name: string;
      slug: string;
      description?: string;
      isSeries?: boolean;
      seo?: Seo;
      image?: RawImage;
      count: number;
    }[]
  >(CATEGORIES);
  return raw
    .filter((c) => c.count > 0)
    .map((c) => ({
      id: c._id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
      isSeries: c.isSeries ?? false,
      count: c.count,
      image: image(c.image, c.name),
      seo: c.seo ?? {},
    }));
}

/** Pages with their own routes rather than the generic page template. */
export const RESERVED_PAGE_SLUGS = new Set(["contact-us"]);

export async function getPages(): Promise<Page[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("sanity", "pages");
  const raw = await sanityClient.fetch<
    {
      _id: string;
      title: string;
      slug: string;
      _updatedAt: string;
      seo?: Seo;
      heroImage?: string;
      body?: PortableTextBlock[];
    }[]
  >(PAGES);
  return raw.map((p) => ({
    id: p._id,
    slug: p.slug,
    title: p.title,
    body: p.body ?? [],
    heroImage: p.heroImage ?? undefined,
    modified: p._updatedAt,
    seo: p.seo ?? {},
  }));
}

export async function getPage(slug: string): Promise<Page | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function getHomePage(): Promise<HomePage> {
  "use cache";
  cacheLife("hours");
  cacheTag("sanity", "pages");
  const raw = await sanityClient.fetch<{
    seo?: Seo;
    productLines?: { title: string; subtitle?: string; image?: RawImage; slug?: string }[];
  } | null>(HOME);
  return {
    seo: raw?.seo ?? {},
    productLines: (raw?.productLines ?? []).map((l) => ({
      title: l.title,
      subtitle: l.subtitle ?? "",
      image: image(l.image, l.title),
      href: l.slug ? `/prod-category/${l.slug}/` : "/shop/",
    })),
  };
}
