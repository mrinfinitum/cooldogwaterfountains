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
      // Old WooCommerce tag archives.
      { source: "/product-tag/:tag*", destination: "/shop/", permanent: true },
      // Served by WordPress (WORDPRESS_URL), which must not share this domain:
      // cart, checkout and accounts (WooCommerce), plus admin, login and media.
      { source: "/cart/", destination: `${WP_URL}/cart/`, permanent: false },
      // WooCommerce payment callbacks (…/?wc-api=…); update gateway webhook URLs too.
      {
        source: "/",
        has: [{ type: "query", key: "wc-api" }],
        destination: `${WP_URL}/`,
        permanent: false,
      },
      {
        source: "/checkout/:path*",
        destination: `${WP_URL}/checkout/:path*`,
        permanent: false,
      },
      {
        source: "/my-account/:path*",
        destination: `${WP_URL}/my-account/:path*`,
        permanent: false,
      },
      {
        source: "/wp-admin/:path*",
        destination: `${WP_URL}/wp-admin/:path*`,
        permanent: false,
      },
      { source: "/wp-login.php", destination: `${WP_URL}/wp-login.php`, permanent: false },
      {
        source: "/wp-content/:path*",
        destination: `${WP_URL}/wp-content/:path*`,
        permanent: true,
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
