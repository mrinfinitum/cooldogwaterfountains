import type { ReactNode } from "react";
import AnnouncementBar from "./AnnouncementBar";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/** Header, footer and skip link around the public site's pages. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="eyebrow sr-only z-50 bg-white px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
