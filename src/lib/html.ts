import sanitizeHtml from "sanitize-html";
import { renderDivi } from "./divi";
import { WP_URL } from "./site";

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  reg: "®",
  trade: "™",
  copy: "©",
  hearts: "♥",
};

/** Decode HTML entities in plain text (titles, names). */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m);
}

/** Strip all tags and collapse whitespace. */
export function toPlainText(html: string, maxLength?: number): string {
  // Decode twice: WordPress sometimes double-encodes (&amp;#8211;).
  const text = decodeEntities(
    decodeEntities(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })),
  )
    .replace(/@ET-DC@[A-Za-z0-9+/=]+@/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

/** The first paragraph with real sentence content (for meta descriptions). */
export function firstParagraph(html: string): string | undefined {
  for (const [, inner] of html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    const text = toPlainText(inner);
    if (
      text.length >= 60 &&
      /[a-z]{3}/.test(text) &&
      !/manufactured for easy installation/i.test(text)
    ) {
      return text;
    }
  }
  // No paragraph tags: use the body text with headings left out.
  const body = toPlainText(html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g, " "));
  return body.length >= 60 ? body : undefined;
}

// Elements with nothing inside but whitespace or line breaks (Divi leaves many).
const EMPTY_ELEMENT =
  /<(p|div|h[2-6]|li|strong|b|em|i|a)(?:\s[^>]*)?>(?:\s|&nbsp;|\u00a0|<br\s*\/?>)*<\/\1>/g;

function removeEmptyElements(html: string): string {
  let previous: string;
  let out = html;
  do {
    previous = out;
    out = out.replace(EMPTY_ELEMENT, "");
  } while (out !== previous);
  return out;
}

const SITE_HOST = /^https?:\/\/(www\.)?cooldogwaterfountains\.com/i;
const WP_ONLY_PATHS = /^\/(wp-content|wp-admin|cart|checkout|my-account)\b/;

/** Turn links to the old WordPress site into links within this app. */
export function toLocalHref(href: string): string {
  const match = href.match(SITE_HOST);
  if (!match) return href;
  const path = href.slice(match[0].length) || "/";
  if (WP_ONLY_PATHS.test(path)) return `${WP_URL}${path}`;
  return path;
}

/**
 * Clean WordPress / Divi page-builder HTML into plain, safe content markup.
 * Divi wrappers, inline styles and scripts are removed; headings, text,
 * lists, images, tables and links are kept.
 */
export function cleanWpHtml(
  html: string,
  options: { images?: boolean; topHeading?: number } = {},
): string {
  const allowImages = options.images ?? true;

  const cleaned = sanitizeHtml(renderDivi(html), {
    allowedTags: [
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "div",
      "a",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "sup",
      "sub",
      "small",
      "ul",
      "ol",
      "li",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      ...(allowImages ? ["img", "figure", "figcaption"] : []),
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      div: ["class"],
      img: ["src", "alt", "width", "height", "srcset", "sizes", "loading", "decoding"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedClasses: { a: ["wp-button"], div: ["wp-row", "wp-col"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    nonTextTags: [
      "script",
      "style",
      "textarea",
      "option",
      "noscript",
      "button",
      "select",
      "video",
      "audio",
      "form",
      "svg",
    ],
    transformTags: {
      h1: "h2",
      a: (tagName, attribs) => {
        const isButton = /\bet_pb_button\b|\bbutton\b/.test(attribs.class ?? "");
        const href = attribs.href ? toLocalHref(attribs.href) : undefined;
        const external = href ? /^https?:\/\//.test(href) && !href.startsWith(WP_URL) : false;
        return {
          tagName,
          attribs: {
            ...(href ? { href } : {}),
            ...(isButton ? { class: "wp-button" } : {}),
            ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          },
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async" },
      }),
    },
  });

  return normalizeHeadings(removeEmptyElements(cleaned), options.topHeading ?? 2)
    .replace(/(<br\s*\/?>\s*){3,}/g, "<br /><br />")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Keep the heading outline valid: content starts at `top` (the page title is
 * the only h1) and never skips a level going down (h2 → h4 becomes h2 → h3).
 */
export function normalizeHeadings(html: string, top = 2): string {
  let previous = top - 1;
  let current = top;
  return html.replace(
    /<(\/?)h([1-6])\b([^>]*)>/gi,
    (_m, closing: string, level: string, rest: string) => {
      if (closing) return `</h${current}>`;
      current = Math.max(top, Math.min(Number(level), previous + 1, 6));
      previous = current;
      return `<h${current}${rest}>`;
    },
  );
}

export function formatPrice(minorUnits: number, minorUnit = 2): string {
  const value = minorUnits / 10 ** minorUnit;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
