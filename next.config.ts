import type { NextConfig } from "next";

// Product and page photos are served from the CMS's media library.
const cms = new URL(process.env.CMS_URL || "https://cms.thedogparkcompany.com");

const isDev = process.env.NODE_ENV === "development";
const isProduction = process.env.VERCEL_ENV === "production";
// Vercel's preview toolbar and comments load from vercel.live (previews only).
const vercelLive = isProduction || isDev ? [] : ["https://vercel.live"];

const stripe = ["https://js.stripe.com", "https://*.js.stripe.com", "https://checkout.stripe.com"];
const googleAnalytics = ["https://www.googletagmanager.com", "https://*.google-analytics.com"];

/**
 * Content Security Policy: what the browser may load. Without nonces, so pages
 * stay static/prerendered (Next's inline bootstrap scripts need 'unsafe-inline');
 * the protection comes from limiting origins, framing, forms, plugins and <base>.
 * Stripe and GA4 origins are from their CSP guides.
 */
const csp = Object.entries({
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...stripe, ...googleAnalytics.slice(0, 1), ...vercelLive],
  "style-src": ["'self'", "'unsafe-inline'", ...vercelLive],
  "img-src": ["'self'", "data:", "blob:", cms.origin, "https://*.stripe.com", ...googleAnalytics, ...vercelLive, ...(vercelLive.length ? ["https://vercel.com"] : [])],
  "font-src": ["'self'", ...vercelLive, ...(vercelLive.length ? ["https://assets.vercel.com"] : [])],
  "media-src": ["'self'", cms.origin],
  "connect-src": [
    "'self'",
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    ...googleAnalytics,
    "https://*.analytics.google.com",
    "https://*.google.com",
    ...vercelLive,
    ...(vercelLive.length ? ["wss://ws-us3.pusher.com"] : []),
  ],
  // Product documents open in an overlay straight from the CMS; Stripe's checkout and 3-D Secure frames.
  "frame-src": ["'self'", cms.origin, ...stripe, "https://hooks.stripe.com", ...vercelLive],
  "worker-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
})
  .map(([directive, sources]) => [directive, ...sources].join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: `camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com")`,
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  // Keep the old WordPress-style URLs (/page-name/) so links and rankings carry over.
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: cms.hostname, pathname: "/wp-content/uploads/**" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Previews (dev.cooldogwaterfountains.com and branch deploys) are never indexed.
      ...(isProduction
        ? []
        : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
    ];
  },
  async redirects() {
    return [
      // The old WordPress front page.
      { source: "/dog-water-fountains/", destination: "/", permanent: true },
      // Old WooCommerce URLs.
      { source: "/product-tag/:tag*", destination: "/shop/", permanent: true },
      { source: "/my-account/:path*", destination: "/account/", permanent: true },
      // Category pages: with only a handful of fountains, the shop lists them all.
      { source: "/prod-category/:path*", destination: "/shop/", permanent: true },
      // Install guide for basin fountains, which are no longer sold here.
      { source: "/water-fountain-install/", destination: "/shop/", permanent: true },
      // Pages retired from the site: planning sheets now open over product pages
      // (with PDF downloads); the rest were unused. See RETIRED_PAGE_SLUGS.
      ...[
        "dog-water-fountain-colors",
        "dog-water-fountain-plumbing",
        "installation-fresh-flow-fountains",
        "dog-water-fountain-resources",
        "success",
      ].map((slug) => ({ source: `/${slug}/`, destination: "/shop/", permanent: true })),
      // Fountains no longer sold on this site.
      ...[
        "cool-dog-drink-cool-bottle-filler-with-pet-hose-single-dog-basin-sst",
        "cool-dog-drink-cool-bottle-filler-with-single-dog-basin-with-hose-bib-sst",
        "cool-dog-water-fountain-dog-bowl-sst",
        "cool-dog-water-fountain-dog-bowl-w-pet-hose-sst",
        "cool-dog-water-fountain-dog-bowl-w-ada-bowl-sst",
        "cool-dog-water-fountain-dog-bowl-w-ada-bowl-pet-hose-sst",
        "cool-dog-fresh-flow-water-fountain-surface-mount-slv",
        "cool-dog-fresh-flow-water-fountain-w-hose-surface-mount-slv",
      ].map((slug) => ({ source: `/fountain/${slug}/`, destination: "/shop/", permanent: true })),
      // Old WordPress admin: content is now edited in the Headless Commerce CMS.
      { source: "/wp-admin/:path*", destination: `${cms.origin}/wp-admin/`, permanent: false },
      { source: "/wp-login.php", destination: `${cms.origin}/wp-admin/`, permanent: false },
      // Old WordPress media links (images now live in the CMS).
      { source: "/wp-content/:path*", destination: "/", permanent: true },
    ];
  },
  turbopack: {
    // A stray package-lock.json in the home folder would otherwise be picked as the root.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
