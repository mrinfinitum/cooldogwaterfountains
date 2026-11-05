import { errorResponse, readJson, str } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";

/** POST /api/account/verify/ { login, key } — confirms the account's email from the emailed link. */
export async function POST(request: Request) {
  const body = await readJson(request);
  try {
    await cmsPost("customers/verify", { login: str(body.login, 100), key: str(body.key, 100) });
    return Response.json({ verified: true });
  } catch (error) {
    return errorResponse(error);
  }
}
