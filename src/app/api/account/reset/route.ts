import type { Customer } from "@/lib/account";
import { errorResponse, readJson, str } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";
import { startSession } from "@/lib/session";

/** POST /api/account/reset/ { login, key, password } — sets a new password from a reset link and signs in. */
export async function POST(request: Request) {
  const body = await readJson(request);
  try {
    const customer = await cmsPost<Customer>("customers/password", {
      login: str(body.login, 100),
      key: str(body.key, 100),
      password: typeof body.password === "string" ? body.password : "",
    });
    await startSession(customer);
    return Response.json({ signedIn: true });
  } catch (error) {
    return errorResponse(error);
  }
}
