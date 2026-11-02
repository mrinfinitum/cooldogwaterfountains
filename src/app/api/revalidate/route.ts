import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

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
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret") ?? "";

  if (!secret || !safeEqual(provided, secret)) {
    return Response.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("cms", "max");
  return Response.json({ revalidated: true });
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
