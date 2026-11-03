import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * True when a request from the CMS carries this storefront's refresh secret
 * (REVALIDATE_SECRET, the "Refresh secret" on the storefront in the CMS).
 */
export function fromCms(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = Buffer.from(request.headers.get("x-revalidate-secret") ?? "");
  const expected = Buffer.from(secret ?? "");
  return Boolean(secret) && provided.length === expected.length && timingSafeEqual(provided, expected);
}
