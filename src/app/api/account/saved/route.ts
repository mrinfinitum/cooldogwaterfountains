import type { SavedProduct } from "@/lib/account";
import { readJson, str, withSession } from "@/lib/account-api";
import { cmsPost } from "@/lib/cms";

/** POST /api/account/saved/ { slug, saved } — saves or un-saves a product for the signed-in customer. */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withSession(async (session) => {
    const saved = await cmsPost<SavedProduct[]>(
      `customers/${session.id}/saved`,
      { slug: str(body.slug), saved: body.saved === true },
      { token: session.token },
    );
    return Response.json({ saved: saved.map((s) => s.slug) });
  });
}
