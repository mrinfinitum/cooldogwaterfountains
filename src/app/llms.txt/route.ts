import { getCategories, getPages, getProducts } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { categoryMetadata, pageMetadata, productMetadata } from "@/lib/seo";
import { CONTACT, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * /llms.txt — a plain-language map of the site for AI assistants
 * (https://llmstxt.org). Built from the same Sanity content as the pages.
 */
export async function GET() {
  const [products, categories, pages] = await Promise.all([
    getProducts(),
    getCategories(),
    getPages(),
  ]);

  const text = (value: unknown) => String(value ?? "");
  const link = (label: string, path: string, note?: string) =>
    `- [${label}](${SITE_URL}${path})${note ? `: ${note}` : ""}`;

  const productLines = products.map((p) => {
    const meta = productMetadata(p);
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
  });

  const lineCategories = categories.filter((c) => !c.isSeries);
  const seriesCategories = categories.filter((c) => c.isSeries);
  const categoryLine = (c: (typeof categories)[number]) => {
    const count = products.filter((p) => p.categories.some((pc) => pc.slug === c.slug)).length;
    const meta = categoryMetadata(c, count);
    return link(c.name, `/prod-category/${c.slug}/`, text(meta.description));
  };

  const contentPages = pages.filter((p) => p.slug !== "contact-us" && !p.seo.noindex);
  const pageLine = (slug: string) => {
    const page = contentPages.find((p) => p.slug === slug);
    return page ? link(page.title, `/${page.slug}/`, text(pageMetadata(page).description)) : null;
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
    `- Online ordering: card checkout on the site (Stripe), with sales tax calculated at checkout and shipping at 12% of the order. Volume and project quotes: ${SITE_URL}/contact-us/`,
    "",
    "## Products",
    "",
    ...productLines,
    "",
    "## Product lines",
    "",
    ...lineCategories.map(categoryLine),
    "",
    "## Series",
    "",
    ...seriesCategories.map(categoryLine),
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
