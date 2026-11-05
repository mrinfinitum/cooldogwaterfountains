import "server-only";
import { headers } from "next/headers";
import { CmsError } from "./cms";
import { sendEmail } from "./email";
import { getSession, type Session } from "./session";
import { CONTACT, SITE_NAME, SITE_URL } from "./site";

/** The shopper's IP (Vercel sets x-forwarded-for), which the CMS uses to throttle sign-in attempts. */
export async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

/** Emails the link that confirms a new account's email (so its past orders can be shown). */
export async function sendVerifyEmail(email: string, firstName: string, verify: { login: string; key: string }) {
  const link = `${SITE_URL}/account/verify/?${new URLSearchParams(verify)}`;
  await sendEmail({
    to: [email],
    replyTo: CONTACT.email,
    subject: `Confirm your email for ${SITE_NAME}`,
    text: [
      `Hi${firstName ? ` ${firstName}` : ""},`,
      "",
      "Please confirm this is your email address, so we can show your orders in My Account:",
      link,
      "",
      "The link works for 7 days. If you didn't create an account, you can ignore this email.",
      "",
      SITE_NAME,
    ].join("\n"),
  });
}

/** Reads a JSON request body as a plain object ({} when it isn't one). */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => ({}));
  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
}

export const str = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** A JSON error reply: the CMS's own message for account errors, a generic one otherwise. */
export function errorResponse(error: unknown) {
  if (error instanceof CmsError && error.code.startsWith("hc_")) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  // The CMS host's own firewall throttles bursts (an HTML 429 page, no hc_ code).
  if (error instanceof CmsError && error.status === 429) {
    return Response.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "retry-after": "300" } },
    );
  }
  console.error("Account request failed", error);
  return Response.json(
    { error: "Something went wrong. Please try again, or call us." },
    { status: 502 },
  );
}

/** Runs `handler` for the signed-in customer, or answers 401. */
export async function withSession(handler: (session: Session) => Promise<Response>) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Please sign in." }, { status: 401 });
  try {
    return await handler(session);
  } catch (error) {
    return errorResponse(error);
  }
}
