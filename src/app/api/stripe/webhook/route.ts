import type Stripe from "stripe";
import { cms } from "@/lib/cms";
import { stripe } from "@/lib/stripe";

/**
 * Stripe webhook: records each paid Checkout session as an order in the CMS
 * (WooCommerce), which reduces stock and notifies the store.
 *
 *   POST /api/stripe/webhook/
 *   Events: checkout.session.completed, checkout.session.async_payment_succeeded
 *   Needs STRIPE_WEBHOOK_SECRET (the endpoint's signing secret).
 *
 * A failed CMS request returns 500 so Stripe retries; the CMS ignores repeats
 * of the same session.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook not configured." }, { status: 500 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return Response.json({ received: true });
  }
  // The Stripe account is shared with other stores; record only this site's checkouts.
  if (event.data.object.metadata?.source !== "cooldogwaterfountains.com") {
    return Response.json({ received: true });
  }

  const session = await stripe().checkout.sessions.retrieve(event.data.object.id, {
    expand: ["line_items.data.price.product"],
  });
  if (session.payment_status !== "paid") return Response.json({ received: true });

  try {
    const order = await cms<{ id: number; existing?: boolean }>("orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(orderFor(session)),
    });
    return Response.json({ received: true, order: order.id });
  } catch (error) {
    console.error("Recording order in the CMS failed", session.id, error);
    return Response.json({ error: "Could not record the order." }, { status: 500 });
  }
}

type Address = Stripe.Address | null | undefined;

const address = (name: string | null | undefined, a: Address) => ({
  name: name ?? "",
  line1: a?.line1 ?? "",
  line2: a?.line2 ?? "",
  city: a?.city ?? "",
  state: a?.state ?? "",
  postalCode: a?.postal_code ?? "",
  country: a?.country ?? "",
});

/** The CMS order for a paid session (amounts in cents, as Stripe charged them). */
function orderFor(session: Stripe.Checkout.Session) {
  const customer = session.customer_details;
  const shipping = session.collected_information?.shipping_details;
  const lines = (session.line_items?.data ?? []).map((line) => {
    const product = line.price?.product;
    const metadata = product && typeof product === "object" && !product.deleted ? product.metadata : {};
    return {
      sku: metadata.sku ?? "",
      name: line.description ?? "",
      quantity: line.quantity ?? 1,
      total: line.amount_subtotal - line.amount_discount,
    };
  });
  return {
    stripeSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    currency: session.currency ?? "usd",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    billing: address(customer?.name, customer?.address),
    shipping: shipping ? address(shipping.name, shipping.address) : address(customer?.name, customer?.address),
    lines,
    shippingTotal: session.shipping_cost?.amount_subtotal ?? 0,
    taxTotal: session.total_details?.amount_tax ?? 0,
    discountTotal: session.total_details?.amount_discount ?? 0,
    total: session.amount_total ?? 0,
  };
}
