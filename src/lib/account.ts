import "server-only";
import { cms } from "./cms";
import { getSession } from "./session";

/**
 * Customer accounts. They live in the CMS and are shared by every storefront
 * (one sign-in, one order history, one saved list); this site only keeps a
 * session cookie saying which customer is signed in. Every getter here reads
 * the session itself, so it can only return the signed-in customer's data.
 */

export type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type Customer = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  billing: Address;
  shipping: Address;
};

type Image = { src: string; alt: string; width?: number; height?: number } | null;
type Storefront = { slug: string; name: string; url: string } | null;

export type Order = {
  id: number;
  number: string;
  date: string;
  status: string;
  statusLabel: string;
  paymentMethod: string;
  poNumber: string;
  tracking: string;
  storefront: Storefront;
  items: {
    name: string;
    sku: string;
    quantity: number;
    total: number;
    productId: number | null;
    slug: string | null;
    color: string | null;
    image: Image;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  billing: Address;
  shippingTo: Address;
};

export type SavedProduct = {
  productId: number;
  slug: string;
  name: string;
  image: Image;
  price: number;
  listPrice: number;
  /** Sold on this storefront (so it can go in the cart here). */
  availableHere: boolean;
  url: string;
  storefront: Storefront;
};

/** The signed-in customer, or null (also null if the account no longer exists). */
export async function getCustomer(): Promise<Customer | null> {
  const session = await getSession();
  if (!session) return null;
  return cms<Customer>(`customers/${session.id}`).catch(() => null);
}

export async function getOrders(): Promise<Order[]> {
  const session = await getSession();
  return session ? cms<Order[]>(`customers/${session.id}/orders`) : [];
}

export async function getSaved(): Promise<SavedProduct[]> {
  const session = await getSession();
  return session ? cms<SavedProduct[]>(`customers/${session.id}/saved`) : [];
}

/** True when an address has the fields an order needs. */
export const isComplete = (a?: Address) => Boolean(a?.line1 && a.city && a.state && a.postalCode);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
