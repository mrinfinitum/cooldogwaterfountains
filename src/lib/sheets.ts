/**
 * Planning sheets: CMS pages shown in an overlay (never as their own page) and
 * offered as a branded PDF download. The PDFs are built from the same content
 * by `npm run sheets` (scripts/build-sheets.mjs); rebuild them after editing
 * one of these pages in the CMS.
 */
export type SheetKey = "installation" | "plumbing" | "colors";

export type Sheet = {
  key: SheetKey;
  /** The CMS page that holds the content. */
  page: string;
  title: string;
  blurb: string;
  pdf: string;
};

export const SHEETS: Sheet[] = [
  {
    key: "installation",
    page: "installation-fresh-flow-fountains",
    title: "Installation guide",
    blurb: "Concrete pad, anchors, supply and drain",
    pdf: "/downloads/cool-dog-installation-guide.pdf",
  },
  {
    key: "plumbing",
    page: "dog-water-fountain-plumbing",
    title: "Plumbing requirements",
    blurb: "Mounting, water pressure and lines",
    pdf: "/downloads/cool-dog-plumbing-requirements.pdf",
  },
  {
    key: "colors",
    page: "dog-water-fountain-colors",
    title: "Color chart",
    blurb: "Standard Color Play® options",
    pdf: "/downloads/cool-dog-color-chart.pdf",
  },
];

export const sheetByKey = (key: string) => SHEETS.find((s) => s.key === key);

/**
 * True when a product's CMS Downloads include this sheet's PDF (uploaded to the
 * Media Library under the same name, e.g. cool-dog-installation-guide.pdf;
 * WordPress may add "-1" etc.).
 */
export function isAttached(sheet: Sheet, downloads: { filename: string }[]) {
  const base = sheet.pdf.split("/").pop()!.replace(/\.pdf$/i, "");
  return downloads.some((d) => new RegExp(`^${base}(-\\d+)?\\.pdf$`, "i").test(d.filename));
}

/** Opens a sheet in the overlay (SheetHost, mounted once in SiteChrome). */
export function openSheet(key: SheetKey) {
  window.dispatchEvent(new CustomEvent("cd:open-sheet", { detail: key }));
}
