import type { Customer, SignedIn } from "@/lib/account";
import { readJson, str, withSession } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";
import { startSession } from "@/lib/session";

const address = (value: unknown) => {
  const a = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    line1: str(a.line1),
    line2: str(a.line2),
    city: str(a.city, 100),
    state: str(a.state, 2).toUpperCase(),
    postalCode: str(a.postalCode, 10),
    country: "US",
  };
};

/**
 * POST /api/account/profile/ — updates the signed-in customer's details,
 * addresses, or password (with currentPassword).
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withSession(async (session) => {
    const update: Record<string, unknown> = {};
    for (const key of ["firstName", "lastName", "company", "phone"] as const) {
      if (key in body) update[key] = str(body[key], key === "phone" ? 40 : 120);
    }
    if ("billing" in body) update.billing = address(body.billing);
    if ("shipping" in body) update.shipping = address(body.shipping);
    if (typeof body.newPassword === "string" && body.newPassword) {
      update.newPassword = body.newPassword;
      update.currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    }
    const { token, ...customer } = await cmsPost<Customer & Partial<SignedIn>>(`customers/${session.id}`, update, {
      token: session.token,
    });
    // A new password signs out every session; this browser stays signed in with the new token.
    if (token) await startSession({ ...customer, token });
    return Response.json({ customer });
  });
}
