# Cool Dog Water Fountains — headless Next.js site

The front end for [cooldogwaterfountains.com](https://www.cooldogwaterfountains.com), built with
Next.js 16. **WordPress + WooCommerce stay the CMS and the store**: pages, products, prices,
colors, photos and SEO fields are all edited in WordPress as before, and this site reads them
through the public WordPress REST API.

The design follows [Filson](https://www.filson.com/)'s layout — tall condensed headlines,
typewriter-style labels, full-bleed photography, mega menus, tabbed product grids — recolored in
teal, blue and aqua.

## What comes from WordPress

| Site section | Source |
| --- | --- |
| Products, prices, colors, photos | WooCommerce Store API (`/wp-json/wc/store/v1/...`) |
| Product categories (names, descriptions, images) | WooCommerce Store API |
| Content pages (Plumbing, Colors, Mission, Terms…) | WordPress pages (`/wp-json/wp/v2/pages`) |
| Page titles & descriptions for search engines | Yoast SEO fields |
| Cart, checkout, accounts | WooCommerce on the WordPress site |

Homepage marketing copy, the menu structure and the contact details live in code
(`src/app/page.tsx`, `src/lib/site.ts`).

### Divi content

The WordPress pages are built with Divi, and the REST API returns them as raw Divi shortcodes.
`src/lib/divi.ts` converts them to clean HTML (text, headings, images, buttons, blurbs, toggles,
rows and columns), then `src/lib/html.ts` sanitizes the result. Layout styling from Divi is
intentionally dropped; pages are restyled to match the new design.

## Studio product photos

Product photos shot on white are re-rendered as clean studio shots: the white background and the
"COOL DOG" watermark are removed, and the product is placed, uncropped, on a soft aqua backdrop
with a floor shadow. The fountain itself is never altered — only the background around it.
Lifestyle photos, close-ups, graphics and paint chips are left as they are.

The studio versions live in `public/studio/`, and `src/data/studio-photos.json` maps each
WordPress photo to its studio version. After adding or changing product photos in WordPress, run
(on a Mac):

```bash
npm run photos
```

then commit the updated `public/studio/` and `src/data/studio-photos.json`. Photos without a
studio version simply show the original from WordPress.

Each color option shows the fountain in that color: the option's own photo if it has one,
otherwise the gallery photo whose file name names the color (e.g. `…-BlueAqua-WM.jpg`).

## SEO

- **Titles & descriptions** come from Yoast when they are specific to the page. Missing ones,
  WordPress defaults ("… Archives") and templated or duplicated ones are replaced with
  page-specific text (`src/lib/seo.ts`). Every page also gets a canonical URL plus Open Graph
  and Twitter tags.
- **Headings**: one `h1` per page (the page/product title); WordPress content is re-leveled so
  it never skips a level.
- **`/sitemap.xml`** lists every page, category and product with their images.
- **`/llms.txt`** is a plain-language map of the site and catalog for AI assistants
  ([llmstxt.org](https://llmstxt.org)), built from the same WordPress data.
- Structured data: `Product` on product pages, `Organization` and `WebSite` on the homepage.

## Routes

| URL | Page |
| --- | --- |
| `/` | Homepage |
| `/shop/` | All fountains |
| `/prod-category/<slug>/` | A product category (same URL as WordPress) |
| `/fountain/<slug>/` | A product (same URL as WordPress) |
| `/contact-us/` | Contact + Build a Quote form |
| `/<page-slug>/` | Any other WordPress page |
| `/cart/`, `/checkout/`, `/my-account/` | Redirect to WooCommerce |

URLs keep WordPress's trailing slashes so existing links and search rankings carry over.

## Getting started

```bash
cp .env.example .env.local   # then edit values
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `WORDPRESS_URL` | The WordPress / WooCommerce site to read from |
| `NEXT_PUBLIC_SITE_URL` | Public address of this site (canonical URLs, sitemap) |
| `REVALIDATE_SECRET` | Shared secret for instant content refresh (below) |

## Keeping content fresh

Content is cached and refreshed from WordPress every hour. To update the site immediately when
something is saved in WordPress, add this to the WordPress theme's `functions.php` (or a small
plugin), using the same secret as `REVALIDATE_SECRET`:

```php
add_action('save_post', function ($post_id) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    wp_remote_post('https://www.cooldogwaterfountains.com/api/revalidate/', [
        'headers'  => ['x-revalidate-secret' => 'YOUR_SECRET'],
        'timeout'  => 5,
        'blocking' => false,
    ]);
});
```

## Going live

1. Move WordPress to a subdomain such as `cms.cooldogwaterfountains.com` (or `shop.`), and set
   `WORDPRESS_URL` to it. Cart, checkout and account links will follow.
2. Point `www.cooldogwaterfountains.com` at this Next.js app (e.g. on Vercel) and set
   `NEXT_PUBLIC_SITE_URL`.
3. Add the revalidation snippet above.
4. In Yoast, keep the WordPress subdomain out of search results (Settings → "Discourage search
   engines" on the CMS host) so only the new site is indexed.

## Notes

- **Quote form** — opens the visitor's email app with the request filled in, addressed to
  `sales@gymsfordogs.com`. To receive submissions directly, connect a form service or email API.
- **Missing pages** — an unknown URL shows the 404 page with a `noindex` tag; because pages
  stream, the HTTP status is 200.
- **Rate limits** — the WordPress host rate-limits bursts of API calls, so the data layer fetches
  each collection in one request and retries politely when asked to slow down.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm run photos  # rebuild studio product photos (macOS)
```
