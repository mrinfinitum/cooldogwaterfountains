"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { swatchColor } from "@/lib/colors";
import type { ProductImage, ProductVariation } from "@/lib/wordpress";
import { CONTACT } from "@/lib/site";
import Price from "./Price";
import { DropIcon, FlagIcon, PhoneIcon, RulerIcon } from "./icons";

type Props = {
  name: string;
  sku: string;
  series?: string;
  summary: string;
  price: number;
  regularPrice: number;
  priceLabel?: string;
  inStock: boolean;
  images: ProductImage[];
  variations: ProductVariation[];
  wpUrl: string;
  productId: number;
  children?: ReactNode;
};

const pickDefault = (variations: ProductVariation[]) =>
  variations.find((v) => /standard/i.test(v.color)) ?? variations[0];

export default function ProductView(props: Props) {
  const { name, sku, series, summary, images, variations, wpUrl, productId, inStock, children } =
    props;

  const [variation, setVariation] = useState(() => pickDefault(variations));
  const [pickedColor, setPickedColor] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Once a shopper picks a color, that color's photo leads the gallery.
  const gallery = useMemo(() => {
    const list = [...images];
    const colorImage = pickedColor ? variation?.image : undefined;
    if (colorImage) {
      const existing = list.findIndex((img) => img.src === colorImage.src);
      if (existing >= 0) list.splice(existing, 1);
      list.unshift(colorImage);
    }
    return list;
  }, [images, variation, pickedColor]);

  const current = gallery[Math.min(imageIndex, gallery.length - 1)];
  const price = variation?.price ?? props.price;
  const regularPrice = variation?.regularPrice ?? props.regularPrice;

  const cartParams = new URLSearchParams({
    "add-to-cart": String(variation?.id ?? productId),
    quantity: String(quantity),
    ...(variation ? { attribute_color: variation.color } : {}),
  });
  const addToCartHref = `${wpUrl}/cart/?${cartParams}`;
  const quoteHref = `/contact-us/?${new URLSearchParams({
    product: name,
    ...(variation ? { color: variation.color } : {}),
    quantity: String(quantity),
  })}`;

  const selectColor = (v: ProductVariation) => {
    setVariation(v);
    setPickedColor(true);
    setImageIndex(0);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      {/* Gallery */}
      <div className="lg:col-span-7">
        <div className="relative aspect-square overflow-hidden bg-mist">
          {current && (
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-contain"
            />
          )}
        </div>
        {gallery.length > 1 && (
          <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto" aria-label="Product photos">
            {gallery.map((img, i) => (
              <li key={img.src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === imageIndex}
                  className={`relative block size-20 overflow-hidden bg-mist outline-offset-2 sm:size-24 ${
                    i === imageIndex ? "outline-2 outline-teal" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt="" fill sizes="96px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Purchase panel */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow text-muted">
            {series ? `${series} Series · ` : ""}SKU {sku}
          </p>
          <h1 className="headline mt-3 text-5xl text-deep lg:text-6xl">{name}</h1>

          <div className="mt-6">
            <Price price={price} regularPrice={regularPrice} label={props.priceLabel} size="lg" />
          </div>

          {summary && <p className="mt-6 leading-relaxed text-ink/75">{summary}</p>}

          {variations.length > 0 && (
            <fieldset className="mt-8">
              <legend className="eyebrow">
                Color: <span className="text-teal">{variation?.color}</span>
              </legend>
              <div className="mt-4 flex flex-wrap gap-3">
                {variations.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectColor(v)}
                    aria-pressed={v.id === variation?.id}
                    aria-label={v.color}
                    title={v.color}
                    className={`size-10 rounded-full border border-black/15 outline-offset-[3px] transition ${
                      v.id === variation?.id
                        ? "outline-2 outline-teal"
                        : "hover:outline-1 hover:outline-ink/40"
                    }`}
                    style={{ background: swatchColor(v.color) }}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex items-center border border-ink/20">
              <button
                type="button"
                className="h-full px-4 text-lg"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className="h-full px-4 text-lg"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {inStock ? (
              <a href={addToCartHref} className="btn btn-primary flex-1">
                Add to Cart
              </a>
            ) : (
              <span className="btn flex-1 cursor-not-allowed bg-line text-muted">Out of Stock</span>
            )}
          </div>
          <Link href={quoteHref} className="btn btn-outline mt-3 w-full">
            Request a Quote
          </Link>

          <ul className="mt-8 grid gap-3 border-y border-line py-6 text-sm">
            <li className="flex items-center gap-3">
              <FlagIcon className="shrink-0 text-teal" /> Designed and manufactured in the USA
            </li>
            <li className="flex items-center gap-3">
              <DropIcon className="shrink-0 text-teal" /> Contractor pricing — volume quotes
              available
            </li>
            <li className="flex items-center gap-3">
              <RulerIcon className="shrink-0 text-teal" /> Installation and assembly available in
              the USA
            </li>
          </ul>
          <a
            href={CONTACT.phoneHref}
            className="eyebrow mt-6 inline-flex items-center gap-2 hover:text-teal"
          >
            <PhoneIcon width={16} height={16} /> Questions? Call {CONTACT.phone}
          </a>

          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </div>
  );
}
