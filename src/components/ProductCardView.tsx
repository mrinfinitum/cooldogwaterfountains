"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { swatchColor } from "@/lib/colors";
import type { ColorOption, Product } from "@/lib/content";

/** The product fields a card needs (kept small: it is sent to the browser). */
export type CardProduct = Pick<
  Product,
  "slug" | "name" | "price" | "regularPrice" | "onSale" | "images" | "options"
>;
import Price from "./Price";

const SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export default function ProductCardView({
  product,
  priority = false,
}: {
  product: CardProduct;
  priority?: boolean;
}) {
  const [first, second] = product.images;
  const series = product.name.match(/\((SST|SLV|STE)\)/)?.[1];
  // Color dot being hovered: the card shows the fountain in that color.
  const [preview, setPreview] = useState<ColorOption | null>(null);

  const href = `/fountain/${product.slug}/${
    preview ? `?${new URLSearchParams({ color: preview.color })}` : ""
  }`;

  // On touch screens the first tap on a dot shows that color instead of
  // opening the product; a second tap opens it with the color selected.
  const onDotClick = (event: MouseEvent, option: ColorOption) => {
    const touch = (event.nativeEvent as PointerEvent).pointerType === "touch";
    if (touch && preview?.id !== option.id) {
      event.preventDefault();
      setPreview(option);
    }
  };

  return (
    <Link href={href} className="group block" onMouseLeave={() => setPreview(null)}>
      <div className="relative aspect-square overflow-hidden bg-mist">
        {first && (
          <Image
            src={first.src}
            alt={first.alt}
            fill
            priority={priority}
            sizes={SIZES}
            className={`object-contain transition duration-500 ${
              preview?.image ? "opacity-0" : second ? "group-hover:opacity-0" : ""
            }`}
          />
        )}
        {second && !preview?.image && (
          <Image
            src={second.src}
            alt=""
            fill
            sizes={SIZES}
            className="object-contain opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        {preview?.image && (
          <Image
            key={preview.image.src}
            src={preview.image.src}
            alt={preview.image.alt}
            fill
            sizes={SIZES}
            className="object-contain"
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
        {product.options.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {product.options.slice(0, 8).map((option) => (
              <span
                key={option.id}
                title={option.color}
                onMouseEnter={() => setPreview(option)}
                onClick={(event) => onDotClick(event, option)}
                className={`size-4 rounded-full border border-black/10 outline-offset-2 transition ${
                  preview?.id === option.id ? "outline-2 outline-teal" : ""
                }`}
                style={{ background: option.swatch ?? swatchColor(option.color) }}
              />
            ))}
            <span className="eyebrow ml-1 text-[10px] text-muted">
              {preview
                ? preview.color
                : `${product.options.length} ${product.options.length === 1 ? "color" : "colors"}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
