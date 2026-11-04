import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Documents from The Dog Park Company document library
 * (docs.thedogparkcompany.com): spec sheets, guides, CAD drawings, catalogs.
 * Managed in the library's own admin; a document belongs to products by slug.
 */

export const DOCS_URL = (process.env.DOCS_URL || "https://docs.thedogparkcompany.com").replace(/\/$/, "");

/** This storefront in the library (its logo and colour are shown in the viewer). */
export const DOCS_STORE = "cool-dog-water-fountains";

export type LibraryDocument = {
  slug: string;
  title: string;
  description: string;
  type: { slug: string; name: string };
  kind: "pdf" | "cad" | "image" | "archive" | "other";
  file: { filename: string; ext: string; size: number; pages: number | null };
  products: { slug: string }[];
  /** Permanent addresses (they keep working when the file is replaced). */
  url: string;
  downloadUrl: string;
  embedUrl: string;
};

async function getLibraryDocuments(): Promise<LibraryDocument[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("docs");
  try {
    const res = await fetch(`${DOCS_URL}/api/v1/documents/`);
    if (!res.ok) return [];
    return (await res.json()) as LibraryDocument[];
  } catch {
    // The library being unreachable must never break a product page.
    return [];
  }
}

/** The library's documents for one product, in the library's order. */
export async function getProductDocuments(productSlug: string): Promise<LibraryDocument[]> {
  return (await getLibraryDocuments()).filter((d) => d.products.some((p) => p.slug === productSlug));
}
