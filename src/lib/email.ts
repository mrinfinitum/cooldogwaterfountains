import "server-only";
import { CONTACT } from "./site";

/** Who receives quote requests. */
export const SALES_RECIPIENTS = [CONTACT.email, "art@gymsfordogs.com"];

/** Who is notified of new orders (WooCommerce's "New order" email goes to the same addresses). */
export const ORDER_RECIPIENTS = [...SALES_RECIPIENTS, "orders@thedogparkcompany.com"];

/**
 * Sends a plain-text email through Resend. Needs RESEND_API_KEY; sends from
 * QUOTE_FROM_EMAIL (a verified Resend domain). Throws if it could not be sent.
 */
export async function sendEmail(message: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  /** Resend sends at most one email per key (within 24 hours), so retries don't duplicate it. */
  idempotencyKey?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(message.idempotencyKey ? { "idempotency-key": message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: process.env.QUOTE_FROM_EMAIL || "Cool Dog Water Fountains <quotes@send.thedogparkcompany.com>",
      to: message.to,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      subject: message.subject,
      text: message.text,
    }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Resend failed: ${res.status} ${detail}`);
  }
}

/** "Name <email>" for a Reply-To header, without characters that would break it. */
export const mailbox = (name: string, email: string) => `${name.replace(/[<>"]/g, "")} <${email}>`;

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
