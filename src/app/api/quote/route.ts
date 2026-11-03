import { CONTACT } from "@/lib/site";

const FIELDS = {
  name: "Name",
  company: "Company / organization",
  email: "Email",
  phone: "Phone",
  projectType: "Project type",
  zip: "Project ZIP code",
  product: "Fountain",
  color: "Color",
  quantity: "Quantity",
  message: "Message",
} as const;

type Field = keyof typeof FIELDS;

/** Who receives quote requests. */
const RECIPIENTS = [CONTACT.email, "art@gymsfordogs.com"];

/**
 * Emails a quote request to RECIPIENTS through Resend, with Reply-To set
 * to the visitor so sales can answer them directly.
 *
 *   POST /api/quote/   { name, email, …, website }
 *   Needs RESEND_API_KEY; sends from QUOTE_FROM_EMAIL (a verified Resend domain).
 *
 * "website" is a hidden field people never see: bots that fill it in get a
 * normal reply but nothing is sent.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const get = (key: string, max = 200) =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";

  if (get("website")) return Response.json({ sent: true });

  const values = Object.fromEntries(
    (Object.keys(FIELDS) as Field[]).map((key) => [key, get(key, key === "message" ? 5000 : 200)]),
  ) as Record<Field, string>;
  if (!values.name) return Response.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("Quote request not sent: RESEND_API_KEY is not set.");
    return Response.json({ error: "Quote requests are not available right now." }, { status: 503 });
  }

  const text = (Object.keys(FIELDS) as Field[])
    .filter((field) => field !== "message")
    .map((field) => `${FIELDS[field]}: ${values[field] || "—"}`)
    .concat(["", values.message || "(no message)"])
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.QUOTE_FROM_EMAIL || "Cool Dog Water Fountains <quotes@send.thedogparkcompany.com>",
      to: RECIPIENTS,
      reply_to: `${values.name.replace(/[<>"]/g, "")} <${values.email}>`,
      subject: `Quote request${values.product ? ` – ${values.product}` : ""} (${values.name})`,
      text,
    }),
  });
  if (!res.ok) {
    console.error("Resend failed", res.status, (await res.text().catch(() => "")).slice(0, 300));
    return Response.json({ error: "Your request could not be sent." }, { status: 502 });
  }
  return Response.json({ sent: true });
}
