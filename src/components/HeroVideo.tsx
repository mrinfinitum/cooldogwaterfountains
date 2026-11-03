"use client";

import { useEffect, useRef } from "react";

/**
 * Background video for the home hero. It starts loading only after the page
 * has finished loading (so the poster image underneath stays the fast first
 * paint), and not at all for visitors with reduced motion or Data Saver on.
 */
export default function HeroVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    if (!video || saveData || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = () => {
      video.src = src;
      video.play().catch(() => {});
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
    />
  );
}
