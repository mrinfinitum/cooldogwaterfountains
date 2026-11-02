import "server-only";

/**
 * Headless Commerce CMS (WordPress + WooCommerce) storefront API.
 * Needs CMS_URL (the CMS address) and CMS_API_KEY (this storefront's key).
 */
export async function cms<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = process.env.CMS_URL?.replace(/\/$/, "");
  const key = process.env.CMS_API_KEY;
  if (!base || !key) throw new Error("CMS_URL and CMS_API_KEY must be set.");
  const res = await fetch(`${base}/wp-json/headless/v1/${path}`, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`CMS request failed: ${res.status} ${path} ${detail.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
