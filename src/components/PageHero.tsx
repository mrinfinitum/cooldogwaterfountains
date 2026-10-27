import Image from "next/image";
import type { ReactNode } from "react";
import { Wave } from "./icons";

export default function PageHero({
  eyebrow,
  title,
  image,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Optional background photo, tinted with the water gradient. */
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-deep via-blue to-teal text-white">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-ink/90 via-deep/70 to-teal/40" />
        </>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[520px] rounded-full bg-aqua/25 blur-3xl"
      />
      <div
        className={`relative mx-auto max-w-[1600px] px-4 lg:px-8 ${image ? "pb-24 pt-28 lg:pb-32 lg:pt-44" : "pb-20 pt-16 lg:pb-28 lg:pt-24"}`}
      >
        {eyebrow && <p className="eyebrow text-aqua-light">{eyebrow}</p>}
        <h1 className="headline mt-4 max-w-5xl text-6xl sm:text-7xl lg:text-9xl">{title}</h1>
        {children}
      </div>
      <Wave className="absolute -bottom-px left-0 h-6 w-full text-white" />
    </section>
  );
}

export function PageHeroSkeleton() {
  return (
    <section className="bg-gradient-to-br from-deep via-blue to-teal">
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="h-3 w-40 animate-pulse bg-white/20" />
        <div className="mt-6 h-20 w-2/3 animate-pulse bg-white/20" />
      </div>
    </section>
  );
}
