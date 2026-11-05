import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Previews (dev.cooldogwaterfountains.com and branch deploys) stay out of search engines.
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account/"] },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
