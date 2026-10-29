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

### Optimizing Yoast in WordPress

`wordpress/cooldog-seo-import.zip` is a one-time WordPress plugin that writes optimized Yoast
titles, meta descriptions and focus keyphrases for every page, product and product category
(copy in `scripts/seo/yoast-copy.py`). Upload it under Plugins → Add New → Upload, open
Tools → Cool Dog SEO Import, review, and click Apply. Current values are backed up and can be
restored from the same screen. Delete the plugin afterwards.

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

Content is cached and refreshed from WordPress every hour. The **Cool Dog Headless** WordPress
plugin (`wordpress/cooldog-headless.zip`, see *Going live*) calls `POST /api/revalidate/` with
the `x-revalidate-secret` header whenever pages, products, prices, stock or categories change,
so updates appear within seconds.

## Going live (headless setup)

Today WordPress runs on WordPress.com's hosting (WP Cloud) at `www`, with DNS and proxying on
Cloudflare. After the switch:

| Address | Serves |
| --- | --- |
| `www.cooldogwaterfountains.com` | This Next.js site on Vercel (all browsing) |
| `shop.cooldogwaterfountains.com` | WordPress + WooCommerce: admin, content API, cart, checkout, My Account, media |

### 1. Deploy to Vercel (nothing changes for visitors yet)

1. Vercel → Add New Project → import `mrinfinitum/cooldogwaterfountains` (framework: Next.js).
2. Environment variables:
   - `WORDPRESS_URL` = `https://www.cooldogwaterfountains.com` (for now)
   - `NEXT_PUBLIC_SITE_URL` = `https://www.cooldogwaterfountains.com`
   - `REVALIDATE_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
3. Deploy and review the `*.vercel.app` preview: pages, products, add to cart, quote form.

### 2. Move WordPress to `shop.cooldogwaterfountains.com`

1. WordPress.com → Upgrades → Domains → Add a domain → *Use a domain I own* → enter
   `shop.cooldogwaterfountains.com` and follow the DNS instructions (add the records in
   Cloudflare; set them to **DNS only** until WordPress.com has issued the SSL certificate).
2. Make `shop.cooldogwaterfountains.com` the **primary** domain. WordPress.com updates the site
   address; old `www` links redirect to it while `www` still points at WordPress.com.
3. Check `https://shop.cooldogwaterfountains.com/wp-admin/`, the cart and a test checkout.
4. **Payment gateways**: update any webhook / IPN URLs in Stripe, PayPal, etc. from `www` to
   `shop` (for example `https://shop.cooldogwaterfountains.com/?wc-api=wc_stripe`).

### 3. Point the website at the new WordPress address

In Vercel, set `WORDPRESS_URL` = `https://shop.cooldogwaterfountains.com` and redeploy.

### 4. Switch `www` to Vercel

1. Vercel → Project → Settings → Domains: add `www.cooldogwaterfountains.com` (primary) and
   `cooldogwaterfountains.com` (redirect to www).
2. Cloudflare DNS, using the records Vercel shows (typically):
   - `www` → CNAME `cname.vercel-dns.com`, **DNS only** (grey cloud)
   - `@` → A `76.76.21.21`, **DNS only**
   Leave MX / email records alone.
3. Remove `www` from WordPress.com's domain list (keep `shop`).

The site's redirects send `/cart/`, `/checkout/`, `/my-account/`, `/wp-admin/`,
`/wp-login.php`, `/wp-content/…` and `/?wc-api=…` on www to the WordPress subdomain.

### 5. Connect WordPress to the website

1. Upload `wordpress/cooldog-headless.zip` (Plugins → Add New → Upload) and activate.
2. Settings → Cool Dog Headless: website address `https://www.cooldogwaterfountains.com`,
   refresh secret = `REVALIDATE_SECRET`. Save, then **Test refresh now** (should report 200).
3. Tick **Send visitors to the website** and save. WordPress pages now redirect to the same page
   on the website; cart, checkout, My Account, admin and logged-in editors stay on WordPress.
4. Hide WordPress from search: WordPress.com → Settings → Reading (or Hosting → Site visibility)
   → *Discourage search engines*. The website is what gets indexed.
5. Optional: `wordpress/cooldog-seo-import.zip` applies optimized Yoast SEO (see SEO above).

### 6. After launch

- Google Search Console: add `www` (if not already) and submit `https://www.cooldogwaterfountains.com/sitemap.xml`.
- Cloudflare: if Bot Fight Mode / WAF is on, add a rule skipping it for
  `shop.cooldogwaterfountains.com/wp-json/*` so Vercel can read content.
- Analytics: the WordPress site used Google Site Kit; add your GA4 tag to this site.

### Day to day

Edit pages, products, prices, photos and Yoast SEO in WordPress (`shop.…/wp-admin`). The website
updates within seconds (Cool Dog Headless) or at most an hour. After adding product photos, run
`npm run photos` and push to refresh the studio versions.

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
