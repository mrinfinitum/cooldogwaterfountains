import "server-only";

/** A CMS request that failed; `message` is the CMS's own (customer-safe) error text when it sent one. */
export class CmsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "",
  ) {
    super(message);
  }
}

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
    let error: { code?: string; message?: string } = {};
    try {
      error = JSON.parse(detail);
    } catch {}
    throw new CmsError(
      error.code?.startsWith("hc_") && error.message
        ? error.message
        : `CMS request failed: ${res.status} ${path} ${detail.slice(0, 200)}`,
      res.status,
      error.code,
    );
  }
  return res.json() as Promise<T>;
}

/** POST a JSON body to the CMS. */
export const cmsPost = <T>(path: string, body: unknown) =>
  cms<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
