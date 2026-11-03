import { createHash } from "node:crypto";
import type { Order } from "@/lib/account";
import { readJson } from "@/lib/account-api";
import { cms } from "@/lib/cms";
import { fromCms } from "@/lib/cms-secret";
import { sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { CONTACT, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Called by the CMS when one of this store's orders is marked Completed
 * (shipped) or gets tracking (see notify.php in the CMS plugin). Reads the
 * order from the CMS and emails the customer in this store's name.
 *
 *   POST /api/order-events/   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { orderId, event: "shipped" | "tracking" }
 */
export async function POST(request: Request) {
  if (!fromCms(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJson(request);
  const orderId = Number(body.orderId);
  const event = body.event === "shipped" ? "shipped" : body.event === "tracking" ? "tracking" : null;
  if (!Number.isInteger(orderId) || !event) return Response.json({ error: "Invalid event." }, { status: 400 });

  let order: Order & { email: string; firstName: string };
  try {
    order = await cms(`orders/${orderId}`);
  } catch (error) {
    console.error("Order event: order not readable", orderId, error);
    return Response.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.email) return Response.json({ sent: false, reason: "no email" });

  const link = /^https?:\/\//.test(order.tracking) ? order.tracking : "";
  const tracking = order.tracking
    ? link
      ? `Track your shipment: ${link}`
      : `Tracking: ${order.tracking}`
    : "We'll email you tracking details as soon as we have them.";
  const ship = order.shippingTo;
  const text = [
    `Hi${order.firstName ? ` ${order.firstName}` : ""},`,
    "",
    event === "shipped"
      ? `Good news: your order #${order.number}${order.poNumber ? ` (PO ${order.poNumber})` : ""} has shipped.`
      : `Here's the tracking for your order #${order.number}${order.poNumber ? ` (PO ${order.poNumber})` : ""}.`,
    "",
    tracking,
    "",
    ...order.items.map((i) => `${i.quantity} × ${i.name}${i.sku ? ` (SKU ${i.sku})` : ""}`),
    "",
    ...(ship.line1
      ? ["Shipping to:", ship.line1, ...(ship.line2 ? [ship.line2] : []), `${ship.city}, ${ship.state} ${ship.postalCode}`, ""]
      : []),
    `Order total: ${formatPrice(order.total)}`,
    "",
    `See your order any time in My Account: ${SITE_URL}/account/orders/${order.number}/`,
    `(No account yet? Create one with ${order.email} and your orders will be there.)`,
    "",
    `Questions? Reply to this email or call ${CONTACT.phone} (${CONTACT.hours}, ${CONTACT.days}).`,
    "",
    SITE_NAME,
  ].join("\n");

  try {
    await sendEmail({
      to: [order.email],
      replyTo: CONTACT.email,
      subject:
        event === "shipped"
          ? `Your ${SITE_NAME} order #${order.number} has shipped`
          : `Tracking for your ${SITE_NAME} order #${order.number}`,
      text,
      // One email per order, event and tracking value, however often the CMS retries.
      idempotencyKey: `order-${order.id}-${event}-${createHash("sha256").update(order.tracking).digest("hex").slice(0, 16)}`,
    });
  } catch (error) {
    console.error("Order event email not sent", order.number, error);
    return Response.json({ error: "Email not sent." }, { status: 502 });
  }
  return Response.json({ sent: true });
}
