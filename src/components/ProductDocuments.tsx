"use client";

import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/format";

type Doc = {
  slug: string;
  title: string;
  typeName: string;
  ext: string;
  size: number;
  pages: number | null;
  viewable: boolean;
  url: string;
  downloadUrl: string;
  embedUrl: string;
};

/**
 * The product's documents from the library: View opens the document (flipbook
 * for PDFs) full-screen over the page; Download saves the current file.
 */
export default function ProductDocuments({ docs }: { docs: Doc[] }) {
  const [open, setOpen] = useState<Doc | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <ul className="mt-4 divide-y divide-line text-[15px]">
        {docs.map((d) => (
          <li key={d.slug} className="flex items-center gap-3 py-3">
            <span className="eyebrow shrink-0 bg-white px-2 py-1 text-[10px]">{d.ext.toUpperCase() || "File"}</span>
            <span className="min-w-0 flex-1">
              <span className="block leading-snug">{d.title}</span>
              <span className="block text-sm text-muted">
                {[d.typeName, d.pages ? `${d.pages} pages` : "", formatBytes(d.size)].filter(Boolean).join(" · ")}
              </span>
            </span>
            {d.viewable && (
              <button type="button" onClick={() => setOpen(d)} className="eyebrow shrink-0 text-teal hover:text-teal-dark">
                View
              </button>
            )}
            <a href={d.downloadUrl} className="eyebrow shrink-0 text-ink hover:text-teal" aria-label={`Download ${d.title}`}>
              Download
            </a>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/80 sm:p-6"
        aria-label={open?.title}
      >
        {open && (
          <div className="mx-auto flex h-full max-w-[1400px] flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line pl-4">
              <p className="min-w-0 flex-1 truncate font-semibold">{open.title}</p>
              <a href={open.url} target="_blank" rel="noopener" className="eyebrow hidden shrink-0 text-muted hover:text-teal sm:inline">
                Open in new tab ↗
              </a>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="flex h-12 w-12 shrink-0 items-center justify-center bg-ink text-white hover:bg-teal"
                aria-label="Close"
                autoFocus
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <iframe
              src={`${open.embedUrl}?store=cool-dog-water-fountains&bar=0`}
              title={open.title}
              allow="fullscreen"
              allowFullScreen
              className="min-h-0 w-full flex-1 border-0"
            />
          </div>
        )}
      </dialog>
    </>
  );
}
