import Link from "next/link";
import type { ResourceLink } from "@/lib/site";
import SheetButton from "./SheetButton";

/** A Resources menu entry: a sheet (opens over the page) or a normal link. */
export default function ResourceLinkItem({ link, className = "" }: { link: ResourceLink; className?: string }) {
  return link.sheet ? (
    <SheetButton sheet={link.sheet} className={className}>
      {link.label}
    </SheetButton>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}
