import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * The signed-in customer, kept in a signed, HTTP-only cookie. The account
 * itself lives in the CMS (shared by every storefront); the cookie only says
 * which CMS customer this browser signed in as, and until when.
 */
export type Session = { id: number; email: string; name: string; exp: number };

const COOKIE = "cd_session";
/** Readable by the browser; only says "someone is signed in here", so pages skip the account fetch otherwise. */
export const HINT_COOKIE = "cd_signed_in";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters).");
  return value;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

function verify(token: string): Session | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return Number.isInteger(session.id) && session.exp > Date.now() / 1000 ? session : null;
  } catch {
    return null;
  }
}

/** The current session, or null. Reads the request cookies. */
export async function getSession(): Promise<Session | null> {
  // Request-time only: the expiry check below compares against the current time.
  await connection();
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verify(token) : null;
}

/** Signs the customer in on this browser (call from a Route Handler). */
export async function startSession(customer: { id: number; email: string; firstName?: string }) {
  const session: Session = {
    id: customer.id,
    email: customer.email,
    name: customer.firstName ?? "",
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  (await cookies()).set(HINT_COOKIE, "1", { sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
  (await cookies()).delete(HINT_COOKIE);
}
