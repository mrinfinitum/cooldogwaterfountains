import Link from "next/link";
import type { ProductCategory } from "@/lib/wordpress";

/** Pill row linking between product categories. */
export default function CategoryNav({
  categories,
  active,
}: {
  categories: ProductCategory[];
  active?: string;
}) {
  const item = (href: string, label: string, isActive: boolean) => (
    <li key={href} className="shrink-0">
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`eyebrow inline-block border px-4 py-2.5 text-[11px] transition ${
          isActive ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
        }`}
      >
        {label}
      </Link>
    </li>
  );

  return (
    <nav aria-label="Fountain categories">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {item("/shop/", "All Fountains", !active)}
        {categories.map((c) =>
          item(`/prod-category/${c.slug}/`, c.name.replace(/^COOL DOG\s+/i, ""), c.slug === active),
        )}
      </ul>
    </nav>
  );
}
