import type { SignedIn } from "@/lib/account";
import { clientIp, errorResponse, readJson, str } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";
import { startSession } from "@/lib/session";

/** POST /api/account/login/ { email, password } — signs in with the shared CMS account. */
export async function POST(request: Request) {
  const body = await readJson(request);
  try {
    const customer = await cmsPost<SignedIn>(
      "customers/login",
      { email: str(body.email), password: typeof body.password === "string" ? body.password : "" },
      { clientIp: await clientIp() },
    );
    await startSession(customer);
    return Response.json({ signedIn: true });
  } catch (error) {
    return errorResponse(error);
  }
}
