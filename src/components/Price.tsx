import { formatPrice } from "@/lib/format";

export default function Price({
  price,
  regularPrice,
  label,
  size = "sm",
}: {
  price: number;
  regularPrice?: number;
  label?: string;
  size?: "sm" | "lg";
}) {
  const showRegular = regularPrice && regularPrice > price;
  return (
    <div className={size === "lg" ? "space-y-1" : ""}>
      {label && <p className="eyebrow text-[10px] text-teal">{label}</p>}
      <p
        className={
          size === "lg"
            ? "flex items-baseline gap-3 text-2xl"
            : "flex items-baseline gap-2 text-[15px]"
        }
      >
        <span className="font-semibold">{formatPrice(price)}</span>
        {showRegular && (
          <s className="text-muted" aria-label={`Regular price ${formatPrice(regularPrice)}`}>
            {formatPrice(regularPrice)}
          </s>
        )}
      </p>
    </div>
  );
}
