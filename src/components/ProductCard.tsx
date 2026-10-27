import Image from "next/image";
import Link from "next/link";
import { swatchColor } from "@/lib/colors";
import type { Product } from "@/lib/wordpress";
import Price from "./Price";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const [first, second] = product.images;
  const series = product.name.match(/\((SST|SLV|STE)\)/)?.[1];

  return (
    <Link href={`/fountain/${product.slug}/`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-mist">
        {first && (
          <Image
            src={first.src}
            alt={first.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition duration-500 ${second ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
          />
        )}
        {second && (
          <Image
            src={second.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {series && (
            <span className="eyebrow bg-white px-2 py-1 text-[10px]">{series} Series</span>
          )}
          {product.onSale && (
            <span className="eyebrow bg-teal px-2 py-1 text-[10px] text-white">
              Contractor Price
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="text-[15px] font-medium leading-snug group-hover:text-teal">
          {product.name}
        </h3>
        <Price price={product.price} regularPrice={product.regularPrice} />
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 7).map((c) => (
              <span
                key={c}
                title={c}
                className="size-3.5 rounded-full border border-black/10"
                style={{ background: swatchColor(c) }}
              />
            ))}
            <span className="eyebrow ml-1 text-[10px] text-muted">
              {product.colors.length} {product.colors.length === 1 ? "color" : "colors"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
