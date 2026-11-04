"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { sheetByKey, type SheetKey } from "@/lib/sheets";
import { CloseIcon, DownloadIcon } from "../icons";

type Loaded = { key: SheetKey; title: string; blurb: string; pdf: string; html: string };

const cache = new Map<string, Loaded>();

/**
 * One overlay for the planning sheets (installation, plumbing, colors), opened
 * from anywhere with openSheet(key). The page underneath stays where it was.
 */
export default function SheetHost() {
  const [key, setKey] = useState<SheetKey | null>(null);
  const [sheet, setSheet] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let current: SheetKey | null = null;
    const onOpen = (e: Event) => {
      const next = (e as CustomEvent<SheetKey>).detail;
      current = next;
      track("view_document", { document: next, file_extension: "sheet" });
      setKey(next);
      setFailed(false);
      const cached = cache.get(next);
      setSheet(cached ?? null);
      if (cached) return;
      fetch(`/api/sheets/${next}/`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data: Loaded) => {
          cache.set(next, data);
          if (current === next) setSheet(data);
        })
        .catch(() => current === next && setFailed(true));
    };
    window.addEventListener("cd:open-sheet", onOpen);
    return () => window.removeEventListener("cd:open-sheet", onOpen);
  }, []);

  // Show or hide the dialog, and keep the page behind it from scrolling.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (key && !dialog.open) dialog.showModal();
    if (!key && dialog.open) dialog.close();
    document.documentElement.style.overflow = key ? "hidden" : "";
  }, [key]);

  const meta = key ? sheetByKey(key) : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setKey(null)}
      onClick={(e) => e.target === e.currentTarget && setKey(null)}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-sm sm:p-6"
      aria-label={meta?.title}
    >
      {meta && (
        <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl">
          <header className="flex shrink-0 items-center gap-4 border-b border-line bg-deep py-4 pl-6 pr-4 text-white sm:pl-10">
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-[10px] text-aqua">Planning &amp; installation</p>
              <h2 className="headline truncate text-3xl sm:text-4xl">{meta.title}</h2>
            </div>
            <a
              href={meta.pdf}
              download
              onClick={() => track("file_download", { file_name: meta.pdf.split("/").pop(), file_extension: "pdf" })}
              className="btn btn-light hidden shrink-0 gap-2 sm:inline-flex"
            >
              <DownloadIcon width={18} height={18} /> Download PDF
            </a>
            <a
              href={meta.pdf}
              download
              aria-label={`Download ${meta.title} (PDF)`}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 hover:bg-white/10 sm:hidden"
            >
              <DownloadIcon />
            </a>
            <button
              type="button"
              onClick={() => setKey(null)}
              className="flex h-11 w-11 shrink-0 items-center justify-center hover:bg-white/10"
              aria-label="Close"
              autoFocus
            >
              <CloseIcon />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {sheet ? (
              <article className="sheet wp-content px-6 py-10 sm:px-10" dangerouslySetInnerHTML={{ __html: sheet.html }} />
            ) : failed ? (
              <p className="p-10 text-[15px]">
                This sheet didn&apos;t load.{" "}
                <a href={meta.pdf} download className="link-underline">
                  Download the PDF
                </a>{" "}
                instead.
              </p>
            ) : (
              <div className="space-y-4 p-10" aria-busy="true">
                <div className="h-6 w-2/3 animate-pulse bg-mist" />
                <div className="h-4 animate-pulse bg-mist" />
                <div className="h-4 w-5/6 animate-pulse bg-mist" />
                <div className="h-64 animate-pulse bg-mist" />
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
