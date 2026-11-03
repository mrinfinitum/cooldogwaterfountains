"use client";

import { usePathname, useRouter } from "next/navigation";
import { toggleSaved, useAccount } from "@/lib/account-client";

/**
 * Save / Saved toggle for a product. Signed-out visitors are sent to sign in
 * and come back to this page.
 */
export default function SaveButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const account = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const saved = account.status === "signed-in" && account.saved.includes(slug);

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (account.status !== "signed-in") {
      router.push(`/account/login/?next=${encodeURIComponent(pathname)}`);
      return;
    }
    await toggleSaved(slug);
  };

  const heart = (
    <svg viewBox="0 0 24 24" width={compact ? 18 : 16} height={compact ? 18 : 16} aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4Z"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save this fountain"}
        className={`grid size-9 place-items-center rounded-full bg-white/90 shadow-sm transition hover:text-teal ${saved ? "text-teal" : "text-ink"}`}
      >
        {heart}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className={`eyebrow inline-flex items-center gap-2 text-[11px] transition hover:text-teal ${saved ? "text-teal" : ""}`}
    >
      {heart} {saved ? "Saved" : "Save"}
    </button>
  );
}
