import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keep the old WordPress-style URLs (/page-name/) so links and rankings carry over.
  trailingSlash: true,
  images: {
    // Product and page images are served by Sanity's image CDN.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/2jkxn6fw/**" },
    ],
  },
  async redirects() {
    return [
      // The old WordPress front page.
      { source: "/dog-water-fountains/", destination: "/", permanent: true },
      // Old WooCommerce URLs.
      { source: "/product-tag/:tag*", destination: "/shop/", permanent: true },
      { source: "/my-account/:path*", destination: "/", permanent: true },
      // Old WordPress admin: content is now edited in the Studio.
      { source: "/wp-admin/:path*", destination: "/studio/", permanent: false },
      { source: "/wp-login.php", destination: "/studio/", permanent: false },
      // Old WordPress media links (images now live on Sanity's CDN).
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
