import { formatPrice } from "@/lib/format";

/**
 * The Contractor Price (what the shopper pays) above the Commercial List Price.
 * Items with no contractor discount show only the list price.
 */
export default function Price({
  price,
  regularPrice,
  label,
  size = "sm",
}: {
  /** Contractor Price in cents (or the list price when there's no discount). */
  price: number;
  /** Commercial List Price in cents. */
  regularPrice?: number;
  /** Optional extra note from the CMS. */
  label?: string;
  size?: "sm" | "lg";
}) {
  const listPrice = regularPrice && regularPrice > price ? regularPrice : undefined;
  const note = label && !/^contractor price$/i.test(label.trim()) ? label : undefined;
  const lg = size === "lg";
  return (
    <div className={lg ? "space-y-2" : "space-y-0.5"}>
      <p className="flex items-baseline gap-2">
        <span className={`eyebrow text-teal ${lg ? "text-[11px]" : "text-[10px]"}`}>
          {listPrice ? "Contractor Price" : "Commercial List Price"}
        </span>
        <span className={`font-semibold ${lg ? "text-2xl" : "text-[15px]"}`}>
          {formatPrice(price)}
        </span>
      </p>
      {listPrice && (
        <p className={`flex items-baseline gap-2 text-muted ${lg ? "text-[15px]" : "text-[13px]"}`}>
          <span className={`eyebrow ${lg ? "text-[11px]" : "text-[10px]"}`}>
            Commercial List Price
          </span>
          <s>{formatPrice(listPrice)}</s>
        </p>
      )}
      {note && <p className="text-[13px] text-muted">{note}</p>}
    </div>
  );
}
