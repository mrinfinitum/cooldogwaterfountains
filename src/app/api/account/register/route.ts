import type { SignedIn } from "@/lib/account";
import { clientIp, errorResponse, readJson, sendVerifyEmail, str } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";
import { startSession } from "@/lib/session";

/**
 * POST /api/account/register/ { email, password, firstName, lastName, company, phone }
 * Creates the shared CMS account (it works on every storefront), signs in, and
 * emails a link to confirm the email (past orders show once it's confirmed).
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (str(body.website)) return Response.json({ signedIn: false });
  try {
    const customer = await cmsPost<SignedIn & { verify?: { login: string; key: string } }>(
      "customers/register",
      {
        email: str(body.email),
        password: typeof body.password === "string" ? body.password : "",
        firstName: str(body.firstName, 80),
        lastName: str(body.lastName, 80),
        company: str(body.company),
        phone: str(body.phone, 40),
      },
      { clientIp: await clientIp() },
    );
    await startSession(customer);
    if (customer.verify) {
      // The account works either way; the customer can ask for the link again from My Account.
      await sendVerifyEmail(customer.email, customer.firstName, customer.verify).catch((error) =>
        console.error("Confirmation email not sent", error),
      );
    }
    return Response.json({ signedIn: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
