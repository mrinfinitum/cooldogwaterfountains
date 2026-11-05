import { sendVerifyEmail, withSession } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";

/** POST /api/account/verify-email/ — emails the signed-in customer a new link to confirm their email. */
export async function POST() {
  return withSession(async (session) => {
    const result = await cmsPost<{ verified?: boolean; login?: string; key?: string; firstName?: string }>(
      `customers/${session.id}/verify-email`,
      {},
      { token: session.token },
    );
    if (result.login && result.key) {
      await sendVerifyEmail(session.email, result.firstName ?? "", { login: result.login, key: result.key });
    }
    return Response.json({ sent: !result.verified, verified: Boolean(result.verified) });
  });
}
