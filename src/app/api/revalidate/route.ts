import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Called by WordPress when content changes, so the site refreshes right away
 * instead of waiting for the hourly cache to expire.
 *
 *   POST /api/revalidate
 *   Header: x-revalidate-secret: <REVALIDATE_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret") ?? "";

  if (!secret || !safeEqual(provided, secret)) {
    return Response.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("wordpress", "max");
  return Response.json({ revalidated: true });
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
