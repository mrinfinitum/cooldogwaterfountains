import type { NextConfig } from "next";

// Product and page photos are served from the CMS's media library.
const cms = new URL(process.env.CMS_URL || "https://cms.thedogparkcompany.com");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keep the old WordPress-style URLs (/page-name/) so links and rankings carry over.
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: cms.hostname, pathname: "/wp-content/uploads/**" },
    ],
  },
  async redirects() {
    return [
      // The old WordPress front page.
      { source: "/dog-water-fountains/", destination: "/", permanent: true },
      // Old WooCommerce URLs.
      { source: "/product-tag/:tag*", destination: "/shop/", permanent: true },
      { source: "/my-account/:path*", destination: "/", permanent: true },
      // Category pages: with only a handful of fountains, the shop lists them all.
      { source: "/prod-category/:path*", destination: "/shop/", permanent: true },
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
