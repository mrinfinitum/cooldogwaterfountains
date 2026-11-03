import { errorResponse, readJson, str } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";
import { sendEmail } from "@/lib/email";
import { CONTACT, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * POST /api/account/forgot/ { email } — emails a password reset link when an
 * account exists. The reply is the same either way, so it doesn't reveal
 * which emails have accounts.
 */
export async function POST(request: Request) {
  const email = str((await readJson(request)).email);
  try {
    const reset = await cmsPost<{ exists: boolean; login?: string; key?: string; firstName?: string }>(
      "customers/password-reset",
      { email },
    );
    if (reset.exists && reset.login && reset.key) {
      const link = `${SITE_URL}/account/reset/?${new URLSearchParams({ login: reset.login, key: reset.key })}`;
      await sendEmail({
        to: [email],
        replyTo: CONTACT.email,
        subject: `Reset your ${SITE_NAME} password`,
        text: [
          `Hi${reset.firstName ? ` ${reset.firstName}` : ""},`,
          "",
          "Use this link to choose a new password (it works once and expires in 24 hours):",
          link,
          "",
          "Your account is shared by all The Dog Park Company stores, so the new password works on each of them.",
          "",
          "If you didn't ask for this, you can ignore this email; your password stays the same.",
          "",
          SITE_NAME,
        ].join("\n"),
      });
    }
    return Response.json({ sent: true });
  } catch (error) {
    return errorResponse(error);
  }
}
