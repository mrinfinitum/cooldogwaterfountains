"use client";

import { useEffect, useRef, useState } from "react";
import type { Download } from "@/lib/content";
import { track } from "@/lib/analytics";
import { formatBytes } from "@/lib/format";
import { CloseIcon, DownloadIcon } from "./icons";

const downloadHref = (d: Download) => `/api/download/?url=${encodeURIComponent(d.url)}`;
const canView = (d: Download) => ["PDF", "JPG", "JPEG", "PNG", "WEBP", "SVG"].includes(d.type.toUpperCase());

/**
 * The product's files from the CMS Downloads box (spec sheets, CAD, guides).
 * The row opens a PDF or image over the page; the icon saves the file. Files
 * that can't be shown in a browser (CAD, ZIP) download from the row too.
 */
export default function ProductDownloads({ downloads }: { downloads: Download[] }) {
  const [open, setOpen] = useState<Download | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const onDownload = (d: Download) =>
    track("file_download", { file_name: d.filename, file_extension: d.type.toLowerCase(), link_text: d.label });

  return (
    <>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {downloads.map((d) => {
          const meta = [d.type || "File", d.size ? formatBytes(d.size) : ""].filter(Boolean).join(" · ");
          const body = (
            <>
              <span className="eyebrow flex h-10 w-10 shrink-0 items-center justify-center bg-white text-[10px] text-teal">
                {(d.type || "File").slice(0, 4)}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-snug group-hover:text-teal">{d.label}</span>
                <span className="block text-sm text-muted">{meta}</span>
              </span>
            </>
          );
          const rowClass = "group flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3 text-left";
          return (
            <li key={d.url} className="flex items-center">
              {canView(d) ? (
                <button
                  type="button"
                  className={rowClass}
                  onClick={() => {
                    track("view_document", { document: d.filename, file_extension: d.type.toLowerCase() });
                    setOpen(d);
                  }}
                >
                  {body}
                </button>
              ) : (
                <a href={downloadHref(d)} className={rowClass} onClick={() => onDownload(d)}>
                  {body}
                </a>
              )}
              <a
                href={downloadHref(d)}
                onClick={() => onDownload(d)}
                aria-label={`Download ${d.label} (${meta})`}
                title="Download"
                className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center text-ink transition hover:bg-brand hover:text-white"
              >
                <DownloadIcon />
              </a>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-sm sm:p-6"
        aria-label={open?.label}
      >
        {open && (
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl">
            <header className="flex shrink-0 items-center gap-4 bg-deep py-3 pl-6 pr-3 text-white">
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-[10px] text-aqua">{open.type}</p>
                <h2 className="headline truncate text-2xl sm:text-3xl">{open.label}</h2>
              </div>
              <a href={downloadHref(open)} onClick={() => onDownload(open)} className="btn btn-light hidden shrink-0 gap-2 sm:inline-flex">
                <DownloadIcon width={18} height={18} /> Download
              </a>
              <a
                href={downloadHref(open)}
                onClick={() => onDownload(open)}
                aria-label={`Download ${open.label}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 hover:bg-white/10 sm:hidden"
              >
                <DownloadIcon />
              </a>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center hover:bg-white/10"
                aria-label="Close"
                autoFocus
              >
                <CloseIcon />
              </button>
            </header>
            {open.type.toUpperCase() === "PDF" ? (
              <iframe src={`${open.url}#view=FitH`} title={open.label} className="min-h-0 w-full flex-1 border-0 bg-mist" />
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-mist p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- any size/format from the CMS */}
                <img src={open.url} alt={open.label} className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
