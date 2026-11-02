import type { NextConfig } from "next";

// Product and page photos are served from the CMS's media library.
const cms = new URL(process.env.CMS_URL || "https://dog-park-company-cms.mystagingwebsite.com");

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
