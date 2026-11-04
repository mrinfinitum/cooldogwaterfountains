import "server-only";
import { getAllPages } from "./content";
import { sheetByKey } from "./sheets";

/**
 * Tidies a CMS page for the sheet layout: drops the page's own banner and
 * repeated headings, and turns "1. …" paragraphs into a numbered list.
 */
function tidy(html: string) {
  let out = html
    // Decorative banner images at the very top.
    .replace(/^\s*<figure class="wp-block-image"><img[^>]*color-play-dogs[^>]*\/><\/figure>/, "")
    // The paw-print graphic (decoration, shown twice on the colors page).
    .replace(/<figure class="wp-block-image"><img[^>]*b8bfa020c243a0c1937b30df972530e16cfa318c[^>]*\/><\/figure>\s*/g, "")
    .replace(/<h2>(DOG WATER FOUNTAIN|COLORPLAY|PLUMBING REQUIREMENTS|Dog Water Fountain Colors)<\/h2>\s*/g, "");
  // Consecutive numbered paragraphs → <ol class="steps">.
  out = out.replace(/(?:<p>\d+\.\s[\s\S]*?<\/p>\s*(?:<p>(?!\d+\.)[A-Z]+:[\s\S]*?<\/p>\s*)?)+/g, (block) => {
    const items: string[] = [];
    for (const m of block.matchAll(/<p>(\d+\.\s)?([\s\S]*?)<\/p>/g)) {
      if (m[1]) items.push(m[2]);
      else items.push(`<span class="note">${m[2]}</span>`);
    }
    // Notes (e.g. CAUTION) attach to the step before them.
    const merged: string[] = [];
    for (const item of items) {
      if (item.startsWith('<span class="note">') && merged.length) merged[merged.length - 1] += item;
      else merged.push(item);
    }
    return `<ol class="steps">${merged.map((i) => `<li>${i}</li>`).join("")}</ol>`;
  });
  return out.trim();
}

export async function getSheet(key: string) {
  const sheet = sheetByKey(key);
  if (!sheet) return null;
  const page = (await getAllPages()).find((p) => p.slug === sheet.page);
  if (!page) return null;
  return { ...sheet, html: tidy(page.html), modified: page.modified };
}
