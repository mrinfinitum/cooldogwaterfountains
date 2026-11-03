import "server-only";
import { CmsError } from "./cms";
import { getSession, type Session } from "./session";

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
