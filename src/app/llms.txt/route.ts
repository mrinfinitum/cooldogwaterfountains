import { SHEETS } from "@/lib/sheets";
import { getPages, getProducts } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { pageMetadata, productMetadata } from "@/lib/seo";
import { CONTACT, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * /llms.txt — a plain-language map of the site for AI assistants
 * (https://llmstxt.org). Built from the same CMS content as the pages.
 */
export async function GET() {
  const [products, pages] = await Promise.all([getProducts(), getPages()]);

  const text = (value: unknown) => String(value ?? "");
  const link = (label: string, path: string, note?: string) =>
    `- [${label}](${SITE_URL}${path})${note ? `: ${note}` : ""}`;

  const productLines = products.map((p) => {
    const meta = productMetadata(p);
    const price =
      p.regularPrice > p.price
        ? `Contractor Price ${formatPrice(p.price)} (Commercial List Price ${formatPrice(p.regularPrice)})`
        : `Commercial List Price ${formatPrice(p.price)}`;
    const colors = p.colors.length ? ` Colors: ${p.colors.join(", ")}.` : "";
    return link(
      p.name,
      `/fountain/${p.slug}/`,
      `${price}. SKU ${p.sku}.${colors} ${text(meta.description)}`,
    );
  });

  const contentPages = pages.filter((p) => p.slug !== "contact-us" && !p.seo.noindex);
  const pageLine = (slug: string) => {
    const page = contentPages.find((p) => p.slug === slug);
    return page ? link(page.title, `/${page.slug}/`, text(pageMetadata(page).description)) : null;
  };
  const guides = ["dog-park-designs"];
  const listed = new Set([...guides, "dog-water-fountains-policy", "dog-water-fountains-terms"]);

  const body = [
    `# ${SITE_NAME}`,
    "",
    "> Commercial-grade dog water fountains and dog rinse stations for dog parks, apartments, condos, HOAs, city parks, veterinary clinics and doggie daycares. Designed and manufactured in the USA, sold with contractor pricing. A brand of The Dog Park Company.",
    "",
    "Key facts:",
    "",
    `- ${products.length} products: Fresh Flow dog water fountains (SLV, powder-coated, no basin so no standing water; push button for surface mount, or lever handle on a rolling base that connects to a garden hose, each with or without a pet hose) and a two-station stainless steel dog rinse station (SST).`,
    "- Color Play® program: standard colors plus custom colors.",
    "- Installation and assembly available across the USA; most maintenance or construction staff can install the fountains.",
    `- Sales and quotes: ${CONTACT.phone} · ${CONTACT.email} · ${CONTACT.hours}, ${CONTACT.days}.`,
    `- Online ordering: card checkout on the site (Stripe), with sales tax calculated at checkout and shipping at 12% of the order. Volume and project quotes: ${SITE_URL}/contact-us/`,
    "",
    "## Products",
    "",
    ...productLines,
    "",
    "## Planning, installation and specifications",
    "",
    ...SHEETS.map((s) => link(`${s.title} (PDF)`, s.pdf, `${s.blurb}.`)),
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
