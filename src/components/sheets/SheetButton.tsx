"use client";

import type { ReactNode } from "react";
import { openSheet, type SheetKey } from "@/lib/sheets";

/** A button that opens a planning sheet in the overlay instead of a new page. */
export default function SheetButton({
  sheet,
  className = "",
  children,
}: {
  sheet: SheetKey;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" data-sheet={sheet} onClick={() => openSheet(sheet)} className={`cursor-pointer text-left ${className}`}>
      {children}
    </button>
  );
}
