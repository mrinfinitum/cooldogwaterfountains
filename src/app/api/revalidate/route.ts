import { revalidateTag } from "next/cache";
import { fromCms } from "@/lib/cms-secret";

/**
 * Called by the CMS whenever catalog content changes (products, stock,
 * categories, colors or pages), so the site refreshes right away instead of
 * waiting for the hourly cache to expire.
 *
 *   POST /api/revalidate/
 *   Header: x-revalidate-secret: <REVALIDATE_SECRET>
 *
 * Set the same secret on the Cool Dog storefront in the CMS (Products → Storefronts).
 */
export async function POST(request: Request) {
  if (!fromCms(request)) {
    return Response.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag("cms", "max");
  return Response.json({ revalidated: true });
}
