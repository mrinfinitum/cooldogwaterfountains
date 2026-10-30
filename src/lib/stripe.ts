import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-side Stripe client. Needs STRIPE_SECRET_KEY. */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    client = new Stripe(key);
  }
  return client;
}

/** Stripe Tax code for shipping charges. */
export const SHIPPING_TAX_CODE = "txcd_92010001";
