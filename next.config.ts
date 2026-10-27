import type { NextConfig } from "next";

const WP_URL = (process.env.WORDPRESS_URL ?? "https://www.cooldogwaterfountains.com").replace(
  /\/$/,
  "",
);
const wpHost = new URL(WP_URL);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Match WordPress URLs (/page-name/) so existing links and rankings carry over.
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: wpHost.protocol.replace(":", "") as "http" | "https",
        hostname: wpHost.hostname,
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async redirects() {
    return [
      // The WordPress front page lives at "/" here.
      { source: "/dog-water-fountains/", destination: "/", permanent: true },
      // Cart, checkout and accounts are handled by WooCommerce.
      { source: "/cart/", destination: `${WP_URL}/cart/`, permanent: false },
      { source: "/checkout/:path*", destination: `${WP_URL}/checkout/:path*`, permanent: false },
      {
        source: "/my-account/:path*",
        destination: `${WP_URL}/my-account/:path*`,
        permanent: false,
      },
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
