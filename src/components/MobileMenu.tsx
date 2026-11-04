"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { CONTACT, type ResourceLink } from "@/lib/site";
import ResourceLinkItem from "./sheets/ResourceLinkItem";
import { CloseIcon, MenuIcon, PhoneIcon } from "./icons";

type NavLink = { href: string; label: string };

export default function MobileMenu({
  products,
  resources,
  company,
}: {
  products: NavLink[];
  resources: ResourceLink[];
  company: NavLink[];
}) {
  const [open, setOpen] = useState(false);

  // Close the drawer when any link inside it is followed.
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a, [data-sheet]")) setOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-2 p-2"
      >
        <MenuIcon width={24} height={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white"
            onClick={closeOnLink}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="eyebrow">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <CloseIcon width={24} height={24} />
              </button>
            </div>

            <nav className="flex-1 px-5 py-6" aria-label="Mobile">
              <details open className="border-b border-line pb-4">
                <summary className="headline cursor-pointer list-none text-3xl">Shop</summary>
                <ul className="mt-3 space-y-2.5">
                  {products.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/shop/" className="link-underline text-[15px] font-semibold">
                      Shop All Fountains
                    </Link>
                  </li>
                </ul>
              </details>
              <details className="border-b border-line py-4">
                <summary className="headline cursor-pointer list-none text-3xl">Resources</summary>
                <ul className="mt-3 space-y-2.5">
                  {resources.map((l) => (
                    <li key={l.label}>
                      <ResourceLinkItem link={l} className="text-[15px]" />
                    </li>
                  ))}
                </ul>
              </details>
              <ul className="space-y-3 py-4">
                {company.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="headline text-3xl">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-3 border-t border-line bg-foam px-5 py-6">
              <Link href="/contact-us/" className="btn btn-primary w-full">
                Build a Quote
              </Link>
              <a
                href={CONTACT.phoneHref}
                className="eyebrow flex items-center justify-center gap-2 py-2"
              >
                <PhoneIcon width={16} height={16} /> {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
