#!/usr/bin/env node
// Builds studio versions of the WooCommerce product photos.
//
//   npm run photos
//
// Downloads every product, color-option and category photo from WordPress,
// re-renders the white/transparent-background product shots with
// scripts/photos/studio.swift (macOS only), saves them to public/studio/,
// and writes src/data/studio-photos.json, which the site uses to swap in the
// studio version of each photo. Photos that aren't plain product shots
// (lifestyle photos, close-ups, color chips) are left as they are.
//
// Run again after adding or changing product photos in WordPress.

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "../..");
const WP_URL = (process.env.WORDPRESS_URL ?? "https://www.cooldogwaterfountains.com").replace(
  /\/$/,
  "",
);
const SIZE = 1400;
const CONCURRENCY = 4;
// Graphics, badges and detail close-ups that sit on white but aren't
// full product photos.
const EXCLUDE = /shield|custom-?colors|detail|closeup/i;

const cacheDir = path.join(root, ".photo-cache");
const srcDir = path.join(cacheDir, "src");
const outDir = path.join(root, "public/studio");
const manifestPath = path.join(root, "src/data/studio-photos.json");
const reportPath = path.join(cacheDir, "report.json");
const swiftSource = path.join(root, "scripts/photos/studio.swift");
const binary = path.join(cacheDir, "studio");

for (const dir of [srcDir, outDir, path.dirname(manifestPath)]) mkdirSync(dir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { headers: { "User-Agent": "cooldog-photo-builder" } });
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(Number(res.headers.get("retry-after")) * 1000 || 500 * 2 ** i);
  }
  throw new Error(`Gave up: ${url}`);
}

async function fetchAll(apiPath) {
  const items = [];
  for (let page = 1, total = 1; page <= total; page++) {
    const sep = apiPath.includes("?") ? "&" : "?";
    const res = await fetchRetry(`${WP_URL}/wp-json/${apiPath}${sep}per_page=100&page=${page}`);
    items.push(...(await res.json()));
    total = Number(res.headers.get("x-wp-totalpages") ?? 1);
  }
  return items;
}

/** "…/uploads/2026/04/Photo-Name.jpg" → "2026-04-photo-name.jpg" */
function outputName(url) {
  const rel = new URL(url).pathname.replace(/^.*\/uploads\//, "");
  return `${rel
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}.jpg`;
}

async function compile() {
  const fresh = existsSync(binary) && statSync(binary).mtimeMs > statSync(swiftSource).mtimeMs;
  if (fresh) return;
  console.log("Compiling studio renderer…");
  await run("swiftc", ["-O", swiftSource, "-o", binary]);
}

async function processPhoto(url) {
  const name = outputName(url);
  const srcPath = path.join(
    srcDir,
    `${name.replace(/\.jpg$/, "")}${path.extname(new URL(url).pathname)}`,
  );
  if (!existsSync(srcPath)) {
    const res = await fetchRetry(url);
    await writeFile(srcPath, Buffer.from(await res.arrayBuffer()));
  }
  const outPath = path.join(outDir, name);
  const { stdout } = await run(binary, [srcPath, outPath, String(SIZE)]);
  return { url, name, ...JSON.parse(stdout.trim()) };
}

async function main() {
  if (process.platform !== "darwin")
    throw new Error("The studio renderer needs macOS (Core Image).");
  await compile();

  console.log(`Reading products from ${WP_URL}…`);
  const [products, variations, categories, front] = await Promise.all([
    fetchAll("wc/store/v1/products"),
    fetchAll("wc/store/v1/products?type=variation"),
    fetchAll("wc/store/v1/products/categories"),
    fetchAll("wp/v2/pages?slug=dog-water-fountains&_fields=content"),
  ]);
  // Photos in the homepage product-line grid (Divi blurbs).
  const blurbImages = [
    ...(front[0]?.content.rendered ?? "").matchAll(/\[et_pb_blurb[^\]]*?image=(?:"|&#8221;|&#8243;|”|″)([^"&”″]+)/g),
  ].map((m) => m[1]);
  const urls = [
    ...new Set(
      [
        ...products.flatMap((p) => p.images.map((i) => i.src)),
        ...variations.flatMap((v) => v.images.map((i) => i.src)),
        ...categories.flatMap((c) => (c.image ? [c.image.src] : [])),
        ...blurbImages,
      ].filter((u) => u.includes("/wp-content/uploads/") && !EXCLUDE.test(u)),
    ),
  ];
  console.log(`${urls.length} photos to check.`);

  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      urls
        .slice(i, i + CONCURRENCY)
        .map((u) =>
          processPhoto(u).catch((error) => ({ url: u, status: "error", reason: String(error) })),
        ),
    );
    results.push(...batch);
    process.stdout.write(`\r${results.length}/${urls.length}`);
  }
  process.stdout.write("\n");

  // Keep entries that are still in use, sorted for stable diffs.
  const manifest = Object.fromEntries(
    results
      .filter((r) => r.status === "ok")
      .sort((a, b) => a.url.localeCompare(b.url))
      .map((r) => [r.url, `/studio/${r.name}`]),
  );
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Remove studio files that are no longer used.
  const used = new Set(Object.values(manifest).map((p) => path.basename(p)));
  for (const file of readdirSync(outDir)) if (!used.has(file)) rmSync(path.join(outDir, file));
  writeFileSync(reportPath, JSON.stringify(results, null, 2));

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const failed = results.filter((r) => r.status === "error");
  console.log(`Studio shots: ${ok}  ·  left as-is: ${skipped}  ·  errors: ${failed.length}`);
  for (const f of failed) console.log(`  ! ${f.url}: ${f.reason}`);
  console.log(
    `Manifest: ${path.relative(root, manifestPath)}  ·  report: ${path.relative(root, reportPath)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
