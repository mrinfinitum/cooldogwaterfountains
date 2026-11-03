import type { Customer } from "@/lib/account";
import { errorResponse, readJson, str } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";
import { startSession } from "@/lib/session";

/**
 * POST /api/account/register/ { email, password, firstName, lastName, company, phone }
 * Creates the shared CMS account (it works on every storefront) and signs in.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (str(body.website)) return Response.json({ signedIn: false });
  try {
    const customer = await cmsPost<Customer>("customers/register", {
      email: str(body.email),
      password: typeof body.password === "string" ? body.password : "",
      firstName: str(body.firstName, 80),
      lastName: str(body.lastName, 80),
      company: str(body.company),
      phone: str(body.phone, 40),
    });
    await startSession(customer);
    return Response.json({ signedIn: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
