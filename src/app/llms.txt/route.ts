import { formatPrice } from "@/lib/html";
import { categoryMetadata, productMetadata, wpPageMetadata } from "@/lib/seo";
import { CONTACT, SERIES_CATEGORIES, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  RESERVED_PAGE_SLUGS,
  getAllSeo,
  getCategories,
  getPages,
  getProducts,
  getSeo,
} from "@/lib/wordpress";

/**
 * /llms.txt — a plain-language map of the site for AI assistants
 * (https://llmstxt.org). Built from the same WordPress data as the pages.
 */
export async function GET() {
  const [products, categories, pages, productSeo, categorySeo] = await Promise.all([
    getProducts(),
    getCategories(),
    getPages(),
    getAllSeo("product"),
    getAllSeo("product_cat"),
  ]);

  const text = (value: unknown) => String(value ?? "");
  const link = (label: string, path: string, note?: string) =>
    `- [${label}](${SITE_URL}${path})${note ? `: ${note}` : ""}`;

  const productLines = await Promise.all(
    products.map(async (p) => {
      const meta = productMetadata(p, await getSeo("product", p.slug), productSeo);
      const price =
        p.regularPrice > p.price
          ? `${formatPrice(p.price)} contractor price (list ${formatPrice(p.regularPrice)})`
          : formatPrice(p.price);
      const colors = p.colors.length ? ` Colors: ${p.colors.join(", ")}.` : "";
      return link(
        p.name,
        `/fountain/${p.slug}/`,
        `${price}. SKU ${p.sku}.${colors} ${text(meta.description)}`,
      );
    }),
  );

  const lineCategories = categories.filter((c) => !SERIES_CATEGORIES.includes(c.slug));
  const seriesCategories = categories.filter((c) => SERIES_CATEGORIES.includes(c.slug));
  const categoryLine = async (c: (typeof categories)[number]) => {
    const count = products.filter((p) => p.categories.some((pc) => pc.slug === c.slug)).length;
    const meta = categoryMetadata(c, count, await getSeo("product_cat", c.slug), categorySeo);
    return link(c.name, `/prod-category/${c.slug}/`, text(meta.description));
  };

  const contentPages = pages.filter(
    (p) => !RESERVED_PAGE_SLUGS.has(p.slug) && p.slug !== "success",
  );
  const pageLine = (slug: string) => {
    const page = contentPages.find((p) => p.slug === slug);
    return page
      ? link(page.title, `/${page.slug}/`, text(wpPageMetadata(page, pages).description))
      : null;
  };
  const guides = [
    "dog-water-fountain-colors",
    "dog-water-fountain-plumbing",
    "water-fountain-install",
    "installation-fresh-flow-fountains",
    "dog-park-designs",
    "dog-water-fountain-resources",
  ];
  const listed = new Set([...guides, "dog-water-fountains-policy", "dog-water-fountains-terms"]);

  const body = [
    `# ${SITE_NAME}`,
    "",
    "> Commercial-grade dog water fountains, bottle fillers and dog rinse stations for dog parks, apartments, condos, HOAs, city parks, veterinary clinics and doggie daycares. Designed and manufactured in the USA, sold with contractor pricing. A brand of The Dog Park Company.",
    "",
    "Key facts:",
    "",
    "- Two product families: Cool Dog stainless steel fountains (SST, marine-grade 316 stainless) and Fresh Flow fountains (SLV, powder-coated, lever handle or push button, surface-mount or portable on a garden hose).",
    "- Color Play® program: standard colors plus custom colors.",
    "- Installation and assembly available across the USA; most maintenance or construction staff can install the fountains.",
    `- Sales and quotes: ${CONTACT.phone} · ${CONTACT.email} · ${CONTACT.hours}, ${CONTACT.days}.`,
    `- Online ordering: add a product to the cart on any product page. Volume and project quotes: ${SITE_URL}/contact-us/`,
    "",
    "## Products",
    "",
    ...productLines,
    "",
    "## Product lines",
    "",
    ...(await Promise.all(lineCategories.map(categoryLine))),
    "",
    "## Series",
    "",
    ...(await Promise.all(seriesCategories.map(categoryLine))),
    "",
    "## Planning, installation and specifications",
    "",
    ...guides.map(pageLine).filter((l): l is string => Boolean(l)),
    "",
    "## Company",
    "",
    link("Shop all fountains", "/shop/"),
    link(
      "Contact us / Build a quote",
      "/contact-us/",
      "Contractor pricing, volume quotes and installer referrals.",
    ),
    ...contentPages
      .filter((p) => !listed.has(p.slug))
      .map((p) => pageLine(p.slug))
      .filter((l): l is string => Boolean(l)),
    "",
    "## Optional",
    "",
    pageLine("dog-water-fountains-terms"),
    pageLine("dog-water-fountains-policy"),
    link("Sitemap", "/sitemap.xml"),
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
