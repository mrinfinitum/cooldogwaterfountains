"use client";

import { track } from "@/lib/analytics";
import { SHEETS, openSheet, type Sheet, type SheetKey } from "@/lib/sheets";
import { DownloadIcon, PaletteIcon, PipeIcon, WrenchIcon } from "../icons";

const ICONS: Record<SheetKey, typeof WrenchIcon> = {
  installation: WrenchIcon,
  plumbing: PipeIcon,
  colors: PaletteIcon,
};

/**
 * Planning sheets as rows: the row opens the sheet over the page; the icon
 * downloads its PDF straight away.
 */
export default function PlanningList({ sheets = SHEETS }: { sheets?: Sheet[] }) {
  return (
    <ul className="mt-4 divide-y divide-line border-y border-line">
      {sheets.map((s) => {
        const Icon = ICONS[s.key];
        return (
          <li key={s.key} className="flex items-center">
            <button
              type="button"
              onClick={() => openSheet(s.key)}
              className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-teal">
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-snug group-hover:text-teal">{s.title}</span>
                <span className="block truncate text-sm text-muted">{s.blurb}</span>
              </span>
            </button>
            <a
              href={s.pdf}
              download
              onClick={() => track("file_download", { file_name: s.pdf.split("/").pop(), file_extension: "pdf" })}
              aria-label={`Download ${s.title} (PDF)`}
              title="Download PDF"
              className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center text-ink transition hover:bg-teal hover:text-white"
            >
              <DownloadIcon />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
