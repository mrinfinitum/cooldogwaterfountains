"use client";

import { useRef, type ReactNode } from "react";
import { ArrowIcon } from "./icons";

/** Horizontal scroll-snap row with previous/next buttons. */
export default function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous"
          className="grid size-11 place-items-center border border-ink/20 hover:border-ink hover:bg-ink hover:text-white"
        >
          <ArrowIcon className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next"
          className="grid size-11 place-items-center border border-ink/20 hover:border-ink hover:bg-ink hover:text-white"
        >
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
