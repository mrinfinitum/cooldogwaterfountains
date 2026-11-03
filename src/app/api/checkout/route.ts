import { SHIPPING_RATE } from "@/lib/format";
import { CartError, priceCart, type RequestedItem } from "@/lib/pricing";
import { SHIPPING_TAX_CODE, stripe } from "@/lib/stripe";

/**
 * Creates a Stripe Checkout session for the cart.
 * Every item is re-priced from the CMS here: prices sent by the browser are ignored.
 * The SKU in each line's product metadata lets the Stripe webhook record the order.
 */
export async function POST(request: Request) {
  let body: { items?: RequestedItem[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let cart: Awaited<ReturnType<typeof priceCart>>;
  try {
    cart = await priceCart(Array.isArray(body.items) ? body.items : []);
  } catch (error) {
    if (error instanceof CartError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const lineItems = cart.lines.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency: "usd",
      unit_amount: line.unitAmount,
      tax_behavior: "exclusive" as const,
      product_data: {
        name: line.name,
        ...(line.sku ? { description: `SKU ${line.sku}` } : {}),
        ...(line.image ? { images: [line.image] } : {}),
        tax_code: line.product.taxCode,
        metadata: { slug: line.product.slug, sku: line.sku, color: line.color ?? "" },
      },
    },
  }));

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: `${origin}/checkout/complete/?session_id={CHECKOUT_SESSION_ID}`,
      line_items: lineItems,
      allowed_payment_method_types: ["card"],
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      customer_creation: "always",
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `Shipping (${Math.round(SHIPPING_RATE * 100)}% of order)`,
            fixed_amount: { amount: cart.shipping, currency: "usd" },
            tax_behavior: "exclusive",
            tax_code: SHIPPING_TAX_CODE,
          },
        },
      ],
      metadata: { source: "cooldogwaterfountains.com" },
    });
    return Response.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Stripe checkout session failed", error);
    return Response.json(
      { error: "Checkout is temporarily unavailable. Please call us to order." },
      { status: 502 },
    );
  }
}
