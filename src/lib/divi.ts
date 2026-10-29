/**
 * Converts Divi page-builder shortcodes ([et_pb_section]…[/et_pb_section])
 * into plain HTML.
 *
 * The WordPress REST API returns Divi pages as raw shortcodes because Divi
 * only renders them on its own front end. This turns the content modules
 * (text, images, buttons, blurbs, calls to action, toggles…) into simple
 * markup and drops layout-only wrappers. The result still goes through the
 * HTML sanitizer afterwards.
 */

const QUOTES = `"“”″′`;
const ATTR = new RegExp(`([\\w-]+)=[${QUOTES}]([^${QUOTES}]*)[${QUOTES}]`, "g");
const SHORTCODE = /\[(\/)?((?:et_pb|dipi|da|dsm|df|dica)_[a-z0-9_]+)([^\]]*)\]/gi;

type Attrs = Record<string, string>;

function parseAttrs(raw: string): Attrs {
  const attrs: Attrs = {};
  for (const [, key, value] of raw.matchAll(ATTR)) {
    attrs[key] = value
      .replace(/%22/g, '"')
      .replace(/%91/g, "[")
      .replace(/%93/g, "]")
      .replace(/&#8217;|&#8216;/g, "'")
      .replace(/&#8221;|&#8220;|&#8243;/g, '"');
  }
  return attrs;
}

const esc = (value: string) =>
  value
    .replace(/&(?!#?\w+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const img = (src?: string, alt = "") => (src ? `<img src="${esc(src)}" alt="${esc(alt)}" />` : "");

const button = (url?: string, text?: string) =>
  url && text ? `<p><a class="et_pb_button" href="${esc(url)}">${esc(text)}</a></p>` : "";

const heading = (level: number, text?: string) =>
  text ? `<h${level}>${esc(text)}</h${level}>` : "";

// Opening / closing HTML for each content module. Anything not listed is
// a layout wrapper: its tags are removed and its inner content kept.
const MODULES: Record<string, (a: Attrs) => [open: string, close: string]> = {
  // Rows and columns keep Divi's side-by-side layout as a simple grid.
  et_pb_row: () => ['<div class="wp-row">', "</div>"],
  et_pb_row_inner: () => ['<div class="wp-row">', "</div>"],
  et_pb_column: () => ['<div class="wp-col">', "</div>"],
  et_pb_column_inner: () => ['<div class="wp-col">', "</div>"],
  et_pb_text: () => ["<div>", "</div>"],
  et_pb_heading: (a) => [heading(2, a.title), ""],
  et_pb_code: () => ["<div>", "</div>"],
  et_pb_fullwidth_code: () => ["<div>", "</div>"],
  et_pb_fullwidth_header: (a) => [
    `<div>${heading(2, a.title)}${a.subhead ? `<p><strong>${esc(a.subhead)}</strong></p>` : ""}`,
    `${button(a.button_one_url, a.button_one_text)}${button(a.button_two_url, a.button_two_text)}</div>`,
  ],
  et_pb_image: (a) => [
    a.url
      ? `<div><a href="${esc(a.url)}">${img(a.src, a.alt || a.title_text)}</a></div>`
      : `<div>${img(a.src, a.alt || a.title_text)}</div>`,
    "",
  ],
  et_pb_fullwidth_image: (a) => [`<div>${img(a.src, a.alt || a.title_text)}</div>`, ""],
  et_pb_button: (a) => [button(a.button_url, a.button_text), ""],
  et_pb_blurb: (a) => [
    `<div>${a.image ? `<div>${img(a.image, a.alt || a.title)}</div>` : ""}${
      a.url && a.title
        ? `<h4><a href="${esc(a.url)}">${esc(a.title)}</a></h4>`
        : heading(4, a.title)
    }`,
    "</div>",
  ],
  et_pb_cta: (a) => [`<div>${heading(3, a.title)}`, `${button(a.button_url, a.button_text)}</div>`],
  et_pb_promo: (a) => [
    `<div>${heading(3, a.title)}`,
    `${button(a.button_url, a.button_text)}</div>`,
  ],
  et_pb_toggle: (a) => [`<div>${heading(4, a.title)}`, "</div>"],
  et_pb_accordion_item: (a) => [`<div>${heading(4, a.title)}`, "</div>"],
  et_pb_tab: (a) => [`<div>${heading(4, a.title)}`, "</div>"],
  et_pb_slide: (a) => [
    `<div>${heading(3, a.heading)}`,
    `${button(a.button_link, a.button_text)}</div>`,
  ],
  et_pb_testimonial: (a) => [
    "<blockquote>",
    `${a.author ? `<p>— ${esc(a.author)}</p>` : ""}</blockquote>`,
  ],
  et_pb_number_counter: (a) => [
    `<p><strong>${esc(a.number ?? "")}</strong> ${esc(a.title ?? "")}</p>`,
    "",
  ],
  et_pb_video: (a) => [a.src ? `<p><a href="${esc(a.src)}">Watch the video</a></p>` : "", ""],
  et_pb_divider: () => ["<hr />", ""],
};

// Modules whose content is dropped entirely (forms, maps, social widgets).
const DROP_NAMES = [
  "et_pb_contact_form",
  "et_pb_signup",
  "et_pb_map",
  "et_pb_fullwidth_map",
  "et_pb_social_media_follow",
  "et_pb_search",
  "et_pb_login",
  "et_pb_comments",
  "et_pb_sidebar",
  "et_pb_menu",
  "et_pb_fullwidth_menu",
].join("|");
const DROP = new RegExp(`\\[(${DROP_NAMES})(?=[\\s\\]])[^\\]]*\\][\\s\\S]*?\\[\\/\\1\\]`, "gi");

const TAG = /\[\/?(?:et_pb|dipi|da|dsm|df|dica)_[^\]]*\]/gi;

/** WordPress turns shortcode quotes into curly-quote entities; undo that. */
function normalizeQuotes(html: string): string {
  return html.replace(TAG, (tag) =>
    tag.replace(/&#82(?:20|21|42|43);|&quot;|&#0?34;/g, '"').replace(/[“”″′]/g, '"'),
  );
}

export function hasDiviShortcodes(html: string): boolean {
  return /\[et_pb_/.test(html);
}

/** First background or full-width image, used as the page banner. */
export function diviHeroImage(raw: string): string | undefined {
  const html = normalizeQuotes(raw);
  const firstSection = html.match(/\[et_pb_section[^\]]*\]/)?.[0];
  const bg = firstSection ? parseAttrs(firstSection).background_image : undefined;
  if (bg) return bg;
  const fullwidth = html.slice(0, 4000).match(/\[et_pb_fullwidth_image[^\]]*\]/)?.[0];
  return fullwidth ? parseAttrs(fullwidth).src : undefined;
}

export function renderDivi(html: string): string {
  if (!hasDiviShortcodes(html)) return html;

  // wpautop wraps shortcodes in <p> and adds <br />; remove those first.
  let out = normalizeQuotes(html)
    .replace(/<p>\s*(\[\/?(?:et_pb|dipi|da|dsm|df|dica)_)/gi, "$1")
    .replace(/(\[\/?(?:et_pb|dipi|da|dsm|df|dica)_[^\]]*\])\s*<\/p>/gi, "$1")
    .replace(/(\[\/?(?:et_pb|dipi|da|dsm|df|dica)_[^\]]*\])\s*<br\s*\/?>/gi, "$1");

  // Remove dropped modules with everything inside them.
  out = out.replace(DROP, "");

  out = out.replace(
    SHORTCODE,
    (_match, closing: string | undefined, name: string, rawAttrs: string) => {
      const render = MODULES[name.toLowerCase()];
      if (!render) return "\n";
      const [open, close] = render(parseAttrs(rawAttrs));
      return closing ? close : open;
    },
  );

  // Divi "dynamic content" placeholders (@ET-DC@…@) only work inside Divi.
  return out.replace(/@ET-DC@[A-Za-z0-9+/=]+@/g, "");
}

export type DiviBlurb = {
  title?: string;
  image?: string;
  alt?: string;
  link?: string;
  /** Inner text of the blurb (HTML). */
  content: string;
};

/** The blurb modules (image + title + short text) on a Divi page, in order. */
export function diviBlurbs(raw: string): DiviBlurb[] {
  const html = normalizeQuotes(raw);
  return [...html.matchAll(/\[et_pb_blurb([^\]]*)\]([\s\S]*?)\[\/et_pb_blurb\]/gi)].map(
    ([, rawAttrs, content]) => {
      const a = parseAttrs(rawAttrs);
      return {
        title: a.title,
        image: a.image,
        alt: a.alt,
        link: a.link_option_url || a.url,
        content,
      };
    },
  );
}
