/**
 * Direct downloads for files attached to products in the CMS (Downloads box).
 * Browsers ignore `download` on links to another site, so a PDF would open in
 * a new tab instead; this streams the file back with "save as" headers.
 *
 *   GET /api/download/?url=<CMS upload URL>
 *
 * Only files in the CMS's uploads folder are served.
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url") ?? "";
  const cms = new URL(process.env.CMS_URL || "https://cms.thedogparkcompany.com");
  let file: URL;
  try {
    file = new URL(target);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (file.origin !== cms.origin || !file.pathname.startsWith("/wp-content/uploads/") || file.pathname.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(file, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return new Response("Not found", { status: 404 });

  const name = decodeURIComponent(file.pathname.split("/").pop() || "download");
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
    "Content-Disposition": `attachment; filename="${name.replace(/[^\w.\- ]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Cache-Control": "public, max-age=3600",
    "X-Robots-Tag": "noindex",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  return new Response(upstream.body, { headers });
}
