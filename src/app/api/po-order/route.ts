import { cms } from "@/lib/cms";
import { SALES_RECIPIENTS, isEmail, mailbox, sendEmail } from "@/lib/email";
import { SHIPPING_RATE, formatPrice } from "@/lib/format";
import { CartError, priceCart, type RequestedItem } from "@/lib/pricing";
import { CONTACT, SITE_NAME } from "@/lib/site";

type Address = { line1: string; line2: string; city: string; state: string; postalCode: string };

/**
 * "Pay by invoice / PO": records the cart as an On hold order in the CMS
 * (stock is reduced and WooCommerce notifies the store), emails it to the
 * sales team, and sends the buyer a confirmation. Sales invoices the buyer and
 * marks the order paid in WooCommerce. Sales tax is not charged here; sales
 * adds it to the invoice if it applies.
 *
 *   POST /api/po-order/
 *   { items, requestId: "po_…", company, name, email, phone, poNumber,
 *     billing: Address, shipping?: Address, notes, website }
 *
 * The same requestId always returns the same order, so a double submit is
 * safe. "website" is a hidden field: bots that fill it in get a normal reply.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const str = (value: unknown, max = 200) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";
  const address = (value: unknown): Address => {
    const a = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    return {
      line1: str(a.line1),
      line2: str(a.line2),
      city: str(a.city, 100),
      state: str(a.state, 2).toUpperCase(),
      postalCode: str(a.postalCode, 10),
    };
  };

  if (str(body.website)) return Response.json({ number: "received" });

  const requestId = str(body.requestId, 80);
  const company = str(body.company);
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone, 40);
  const poNumber = str(body.poNumber, 60);
  const notes = str(body.notes, 2000);
  const billing = address(body.billing);
  const shipping = body.shipping ? address(body.shipping) : billing;

  const missing = [
    !company && "company",
    !name && "contact name",
    !isEmail(email) && "a valid email",
    !phone && "phone",
    ...[billing, shipping].flatMap((a, i) => {
      const label = i ? "shipping" : "billing";
      return !a.line1 || !a.city || !/^[A-Z]{2}$/.test(a.state) || !/^\d{5}(-\d{4})?$/.test(a.postalCode)
        ? [`a complete ${label} address`]
        : [];
    }),
  ].filter(Boolean);
  if (!/^po_[A-Za-z0-9-]{8,}$/.test(requestId)) missing.unshift("a request ID");
  if (missing.length) {
    return Response.json({ error: `Please enter ${[...new Set(missing)].join(", ")}.` }, { status: 400 });
  }

  let cart: Awaited<ReturnType<typeof priceCart>>;
  try {
    cart = await priceCart(Array.isArray(body.items) ? (body.items as RequestedItem[]) : []);
  } catch (error) {
    if (error instanceof CartError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const total = cart.subtotal + cart.shipping;
  const shippingLabel = `Shipping (${Math.round(SHIPPING_RATE * 100)}% of order)`;
  const cmsAddress = (a: Address) => ({ name, company, ...a, country: "US" });

  let order: { id: number; number: string; existing?: boolean };
  try {
    order = await cms("orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentMethod: "invoice",
        requestId,
        poNumber,
        company,
        notes,
        currency: "usd",
        email,
        phone,
        billing: cmsAddress(billing),
        shipping: cmsAddress(shipping),
        lines: cart.lines.map((l) => ({
          sku: l.sku,
          name: l.name,
          quantity: l.quantity,
          total: l.unitAmount * l.quantity,
        })),
        shippingTotal: cart.shipping,
        shippingLabel,
        taxTotal: 0,
        total,
      }),
    });
  } catch (error) {
    console.error("PO order not recorded", error);
    return Response.json(
      { error: `Your order could not be placed. Please call ${CONTACT.phone}.` },
      { status: 502 },
    );
  }
  if (order.existing) return Response.json({ number: order.number });

  const formatAddress = (a: Address) =>
    [a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`].filter(Boolean).join("\n");
  const summary = [
    ...cart.lines.map(
      (l) => `${l.quantity} × ${l.name}${l.sku ? ` (SKU ${l.sku})` : ""} — ${formatPrice(l.unitAmount * l.quantity)}`,
    ),
    "",
    `Subtotal: ${formatPrice(cart.subtotal)}`,
    `${shippingLabel}: ${formatPrice(cart.shipping)}`,
    "Sales tax: added to the invoice if it applies",
    `Total before tax: ${formatPrice(total)}`,
  ].join("\n");
  const details = [
    `Company: ${company}`,
    `Contact: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `PO number: ${poNumber || "—"}`,
    "",
    "Bill to:",
    formatAddress(billing),
    "",
    "Ship to:",
    formatAddress(shipping),
    ...(notes ? ["", "Notes:", notes] : []),
  ].join("\n");

  // The order is already recorded (and WooCommerce has emailed the store), so a failed email is only logged.
  const sent = await Promise.allSettled([
    sendEmail({
      to: SALES_RECIPIENTS,
      replyTo: mailbox(name, email),
      subject: `Invoice / PO order #${order.number} – ${company}${poNumber ? ` (PO ${poNumber})` : ""}`,
      text: [
        `New Invoice / PO order #${order.number} from ${SITE_NAME}. It is On hold in WooCommerce → Orders:`,
        "send the invoice, then mark the order Processing once paid.",
        "",
        summary,
        "",
        details,
      ].join("\n"),
    }),
    sendEmail({
      to: [email],
      replyTo: CONTACT.email,
      subject: `Your ${SITE_NAME} order #${order.number}${poNumber ? ` (PO ${poNumber})` : ""}`,
      text: [
        `Hi ${name},`,
        "",
        `Thank you for your order. Our sales team will email your invoice${poNumber ? ` for PO ${poNumber}` : ""}, usually within one business day. Your order ships once the invoice is paid or your terms are approved.`,
        "",
        `Order #${order.number}`,
        summary,
        "",
        details,
        "",
        `Questions? Reply to this email or call ${CONTACT.phone} (${CONTACT.hours}, ${CONTACT.days}).`,
        "",
        SITE_NAME,
      ].join("\n"),
    }),
  ]);
  for (const result of sent) {
    if (result.status === "rejected") console.error("PO order email not sent", order.number, result.reason);
  }

  return Response.json({ number: order.number });
}
