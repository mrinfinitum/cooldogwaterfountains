import "server-only";
import { getProducts, type Product } from "./content";
import { shippingFor } from "./format";

export type RequestedItem = { slug?: unknown; color?: unknown; quantity?: unknown };

export type PricedLine = {
  product: Product;
  color?: string;
  sku: string;
  /** Product name, with the color when one was chosen. */
  name: string;
  image?: string;
  quantity: number;
  /** Cents. */
  unitAmount: number;
};

/** A cart that can't be ordered as sent; `status` is the HTTP status to answer with. */
export class CartError extends Error {
  constructor(
    message: string,
    readonly status = 409,
  ) {
    super(message);
  }
}

/**
 * Prices a cart from the CMS. Prices sent by the browser are ignored, and
 * items that are gone, out of stock or in an unknown color are refused.
 */
export async function priceCart(requested: RequestedItem[]) {
  const items = requested.slice(0, 50);
  if (!items.length) throw new CartError("Your cart is empty.", 400);

  const products = await getProducts();
  const lines: PricedLine[] = [];
  for (const item of items) {
    const slug = typeof item.slug === "string" ? item.slug : "";
    const color = typeof item.color === "string" ? item.color : undefined;
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    const product = products.find((p) => p.slug === slug);
    if (!product) throw new CartError("A product in your cart is no longer available.");
    if (!product.inStock) throw new CartError(`${product.name} is out of stock.`);
    const option = color ? product.options.find((o) => o.color === color) : undefined;
    if (color && !option) throw new CartError(`${product.name} is not available in ${color}.`);
    if (option && !option.inStock) {
      throw new CartError(`${product.name} in ${option.color} is out of stock.`);
    }
    lines.push({
      product,
      color: option?.color,
      sku: option?.sku ?? product.sku,
      name: option ? `${product.name} – ${option.color}` : product.name,
      image: option?.image?.src ?? product.images[0]?.src,
      quantity,
      unitAmount: option?.price ?? product.price,
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0);
  return { lines, subtotal, shipping: shippingFor(subtotal) };
}
