# Cool Dog Water Fountains

The website for [cooldogwaterfountains.com](https://www.cooldogwaterfountains.com), built with
Next.js 16 and hosted on Vercel.

- **Content:** pages, products, prices, colors, photos and SEO are edited in
  [Sanity](https://www.sanity.io) at **`/studio`** (project `2jkxn6fw`, dataset `production`).
- **Checkout:** cart on the site; payment through Stripe's embedded checkout on `/checkout`, with
  Stripe Tax, shipping at 12% of the order, card payments only. Orders, receipts and refunds live
  in the Stripe dashboard.

The design follows [Filson](https://www.filson.com/)'s layout, recolored in teal, blue and aqua.

## Editing content

Open `https://www.cooldogwaterfountains.com/studio` and sign in with your Sanity account.

| In the Studio | What it controls |
| --- | --- |
| Home page | The "Shop by fountain" grid and the home page's search title/description |
| Products | Name, price (and crossed-out regular price), stock, photos, color options (each with a swatch, photo and optional price), categories, Stripe tax code, SEO |
| Categories | Category pages; tick **Product series** for SST / SLV / Shelter Strong |
| Pages | Content pages (Plumbing, Colors, Mission, Terms…) with rich text, images and image grids |

Publishing refreshes the website within seconds (a Sanity webhook calls `/api/revalidate/`);
otherwise content refreshes hourly. Invite editors at
[sanity.io/manage](https://www.sanity.io/manage/project/2jkxn6fw) → Members (free for up to 20).

## Checkout

1. Shoppers add products (with color and quantity) to the cart; it is kept in their browser.
2. `/checkout` asks `POST /api/checkout/` for a Stripe Checkout session. The server re-prices every
   item from Sanity (browser prices are ignored), adds shipping (12% of the subtotal, taxed with
   code `txcd_92010001`) and turns on Stripe Tax.
3. Stripe's checkout form is embedded on the page (card only). After payment the shopper lands on
   `/checkout/complete/`, which confirms the session with Stripe and empties the cart.
4. Stripe emails the receipt; turn on **successful payment** notifications in Stripe so the team is
   emailed about each order.

Stripe Tax must be active with your tax registrations in the Stripe dashboard.

## Routes

| URL | Page |
| --- | --- |
| `/` | Home |
| `/shop/` | All fountains |
| `/prod-category/<slug>/` | A category (same URLs as the old WooCommerce site) |
| `/fountain/<slug>/` | A product (same URLs as the old site) |
| `/<slug>/` | Content pages |
| `/contact-us/` | Contact + Build a Quote form (opens an email to sales) |
| `/cart/`, `/checkout/`, `/checkout/complete/` | Cart and Stripe checkout |
| `/studio/` | Sanity Studio (content editor) |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | Search engines and AI assistants |

Old WordPress URLs redirect: `/dog-water-fountains/` → `/`, `/product-tag/*` → `/shop/`,
`/my-account/*` and `/wp-content/*` → `/`, `/wp-admin/*` → `/studio/`.

## Getting started

```bash
cp .env.example .env.local   # then fill in values
npm install
npm run dev                  # http://localhost:3000 (Studio at /studio)
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public address of the site (canonical URLs, sitemap, Stripe return URL) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | Sanity project (`2jkxn6fw` / `production`) |
| `REVALIDATE_SECRET` | Shared secret the Sanity webhook sends to `/api/revalidate/` |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `SANITY_API_WRITE_TOKEN` | Optional, local scripts only (not needed by the website) |

## SEO

- Titles, descriptions and focus keyphrases are edited per item in the Studio (SEO section);
  when empty, the site builds them from the content (`src/lib/seo.ts`). Each page gets a canonical
  URL plus Open Graph and Twitter tags; "Hide from search engines" adds `noindex`.
- One `h1` per page; rich-text headings start at `h2` (product descriptions at `h3`).
- Structured data: `Product` on product pages, `Organization` and `WebSite` on the home page.

## Code map

| Path | What |
| --- | --- |
| `src/lib/content.ts` | Sanity queries (cached, tagged `sanity`) |
| `src/sanity/` | Studio schemas, env and client; `sanity.config.ts` configures the Studio |
| `src/lib/cart.ts` | Browser cart |
| `src/app/api/checkout/route.ts` | Stripe Checkout session (re-pricing, tax, shipping) |
| `src/components/RichText.tsx` | Renders Sanity rich text |
| `public/media/` | Design images, logos and the hero video |

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```
