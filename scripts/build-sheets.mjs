// Prints each planning sheet (/print/sheet/<key>/) to public/downloads/*.pdf
// with headless Chrome. Run with the dev server up:  npm run sheets
// (optionally BASE=http://localhost:3000).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const SHEETS = {
  installation: "cool-dog-installation-guide.pdf",
  plumbing: "cool-dog-plumbing-requirements.pdf",
  colors: "cool-dog-color-chart.pdf",
};
const CHROME = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Chrome not found; set CHROME=/path/to/chrome");

for (const [key, file] of Object.entries(SHEETS)) {
  const out = resolve("public/downloads", file);
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=15000",
    `--print-to-pdf=${out}`,
    `${BASE}/print/sheet/${key}/`,
  ], { stdio: "inherit" });
  console.log("wrote", out);
}
