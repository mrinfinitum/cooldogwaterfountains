import { cookies } from "next/headers";
import { getCustomer, getSaved } from "@/lib/account";
import { HINT_COOKIE } from "@/lib/session";

/**
 * GET /api/account/me/ — what the browser needs about the signed-in customer:
 * their details (to fill in checkout) and saved product slugs (for Save
 * buttons). Pages stay static; this is fetched after they load.
 */
export async function GET() {
  const customer = await getCustomer();
  if (!customer) {
    (await cookies()).delete(HINT_COOKIE);
    return Response.json({ signedIn: false }, { headers: { "cache-control": "no-store" } });
  }
  const saved = await getSaved().catch(() => []);
  return Response.json(
    { signedIn: true, customer, saved: saved.map((s) => s.slug) },
    { headers: { "cache-control": "private, no-store" } },
  );
}
