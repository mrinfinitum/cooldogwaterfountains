import { getProducts } from "@/lib/content";
import { SHIPPING_RATE, shippingFor } from "@/lib/format";
import { SHIPPING_TAX_CODE, stripe } from "@/lib/stripe";

type RequestedItem = { slug?: unknown; color?: unknown; quantity?: unknown };

/**
 * Creates a Stripe Checkout session for the cart.
 * Every item is re-priced from Sanity here: prices sent by the browser are ignored.
 */
export async function POST(request: Request) {
  let body: { items?: RequestedItem[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const requested = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!requested.length) return Response.json({ error: "Your cart is empty." }, { status: 400 });

  const products = await getProducts();
  const lineItems = [];
  let subtotal = 0;

  for (const item of requested) {
    const slug = typeof item.slug === "string" ? item.slug : "";
    const color = typeof item.color === "string" ? item.color : undefined;
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    const product = products.find((p) => p.slug === slug);
    if (!product) {
      return Response.json(
        { error: "A product in your cart is no longer available." },
        { status: 409 },
      );
    }
    if (!product.inStock) {
      return Response.json({ error: `${product.name} is out of stock.` }, { status: 409 });
    }
    const option = color ? product.options.find((o) => o.color === color) : undefined;
    if (color && !option) {
      return Response.json(
        { error: `${product.name} is not available in ${color}.` },
        { status: 409 },
      );
    }
    const unitAmount = option?.price ?? product.price;
    const image = option?.image?.src ?? product.images[0]?.src;
    subtotal += unitAmount * quantity;
    lineItems.push({
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        tax_behavior: "exclusive" as const,
        product_data: {
          name: option ? `${product.name} – ${option.color}` : product.name,
          ...(product.sku ? { description: `SKU ${product.sku}` } : {}),
          ...(image ? { images: [image] } : {}),
          tax_code: product.taxCode,
          metadata: { slug: product.slug, sku: product.sku, color: option?.color ?? "" },
        },
      },
    });
  }

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
            fixed_amount: { amount: shippingFor(subtotal), currency: "usd" },
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
