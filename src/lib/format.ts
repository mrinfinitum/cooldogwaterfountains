/** Format an amount in cents as US dollars ($3,790 or $3,790.50). */
export function formatPrice(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

/** Product name without an all-caps "COOL DOG" brand prefix, for menus and links. */
export const shortName = (name: string) =>
  name
    .replace(/^COOL DOG\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

/** Product series from the SKU's last segment (e.g. DL-RNSE2-SST → SST). */
export const seriesOf = (sku: string) => sku.match(/-(SST|SLV|STE)$/i)?.[1].toUpperCase();

/** Shipping is charged as a share of the product subtotal. */
export const SHIPPING_RATE = 0.12;
export const shippingFor = (subtotalCents: number) => Math.round(subtotalCents * SHIPPING_RATE);
