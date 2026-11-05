import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CONTACT, LOGO, SITE_URL } from "@/lib/site";
import { SHEETS } from "@/lib/sheets";
import { getSheet } from "@/lib/sheets-server";

/**
 * Print layout for a planning sheet. Not linked anywhere: scripts/build-sheets.mjs
 * prints it to the PDF in public/downloads/.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return SHEETS.map((s) => ({ key: s.key }));
}

export default async function PrintSheet({ params }: PageProps<"/print/sheet/[key]">) {
  const { key } = await params;
  const sheet = await getSheet(key);
  if (!sheet) notFound();
  return (
    <div className="mx-auto w-full max-w-[760px] bg-white px-2 py-4 print:p-0">
      <header className="flex items-end justify-between gap-6 border-b-4 border-teal pb-5">
        <div>
          <p className="eyebrow text-[10px] text-teal">Planning &amp; installation</p>
          <h1 className="headline mt-2 text-5xl text-deep">{sheet.title}</h1>
          <p className="mt-1 text-sm text-muted">{sheet.blurb}</p>
        </div>
        <Image src={LOGO.src} alt="Cool Dog Water Fountains" width={180} height={Math.round((180 * LOGO.height) / LOGO.width)} unoptimized />
      </header>
      {/* Eager images: lazy ones may not load before Chrome prints. */}
      <article
        className="sheet wp-content mt-8"
        dangerouslySetInnerHTML={{ __html: sheet.html.replace(/\sloading="lazy"/g, "") }}
      />
      <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
        <span>
          Cool Dog Water Fountains · {CONTACT.phone} · {CONTACT.email}
        </span>
        <span>{SITE_URL.replace("https://", "")}</span>
      </footer>
    </div>
  );
}
