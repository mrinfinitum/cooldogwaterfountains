import { NextResponse, type NextRequest } from "next/server";
import { hit } from "@/lib/rate-limit";

/**
 * Guards the API routes before they run:
 *  - Cross-site requests can't change anything (CSRF): POSTs from another
 *    site's page are refused. Server-to-server callers (Stripe, the CMS) are
 *    exempt; they prove themselves with signatures/secrets in the route.
 *  - Oversized request bodies are refused.
 *  - Per-address rate limits on sign-in, sign-up, password reset, the quote
 *    and PO forms, checkout and downloads.
 */

/** Called by Stripe or the CMS, not by browsers. */
const SERVER_TO_SERVER = ["/api/stripe/webhook/", "/api/revalidate/", "/api/order-events/"];

/** [path prefix, requests allowed, window in seconds]: the first match wins. */
const LIMITS: [string, number, number][] = [
  ["/api/account/login/", 10, 10 * 60],
  ["/api/account/register/", 5, 60 * 60],
  ["/api/account/forgot/", 5, 60 * 60],
  ["/api/account/reset/", 10, 60 * 60],
  ["/api/quote/", 5, 10 * 60],
  ["/api/po-order/", 5, 10 * 60],
  ["/api/checkout/", 20, 10 * 60],
  ["/api/download/", 60, 60],
  ["/api/", 120, 60],
];

const MAX_BODY_BYTES = 64 * 1024;

/** The visitor's address. On Vercel, x-forwarded-for is set by the platform, not the client. */
function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const refuse = (status: number, error: string, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers: { "cache-control": "no-store", ...headers } });

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const changes = !["GET", "HEAD", "OPTIONS"].includes(request.method);

  if (SERVER_TO_SERVER.some((p) => path.startsWith(p))) return NextResponse.next();

  if (changes) {
    // Browsers send Origin (and Sec-Fetch-Site) on POSTs; refuse ones from other sites.
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    if ((origin && origin !== request.nextUrl.origin) || fetchSite === "cross-site") {
      return refuse(403, "Cross-site request refused.");
    }
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return refuse(413, "Request too large.");
  }

  const [prefix, limit, windowSeconds] = LIMITS.find(([p]) => path.startsWith(p))!;
  const wait = hit(`${prefix}|${clientIp(request)}`, limit, windowSeconds);
  if (wait) {
    return refuse(429, "Too many requests. Please wait a few minutes and try again.", {
      "retry-after": String(wait),
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
