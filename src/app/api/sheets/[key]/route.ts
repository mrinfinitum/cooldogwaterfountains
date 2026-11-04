import { getSheet } from "@/lib/sheets-server";

/** A planning sheet's content for the overlay (SheetHost). */
export async function GET(_request: Request, { params }: RouteContext<"/api/sheets/[key]">) {
  const { key } = await params;
  const sheet = await getSheet(key);
  if (!sheet) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(sheet, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" },
  });
}
