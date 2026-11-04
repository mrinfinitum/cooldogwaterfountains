"use client";

import Image from "next/image";
import Link from "next/link";
import SaveButton from "./account/SaveButton";
import { gaItem, track } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { swatchColor } from "@/lib/colors";
import { addToCart } from "@/lib/cart";
import type { ColorOption, ProductImage } from "@/lib/content";
import { CONTACT } from "@/lib/site";
import Price from "./Price";
import { CheckIcon, DropIcon, FlagIcon, PhoneIcon, RulerIcon } from "./icons";

type Props = {
  name: string;
  sku: string;
  series?: string;
  /** A short intro for the buy box (2–3 lines). */
  lead?: string;
  /** Key selling points shown as a checklist under the intro. */
  highlights?: string[];
  price: number;
  regularPrice: number;
  priceLabel?: string;
  inStock: boolean;
  images: ProductImage[];
  variations: ColorOption[];
  slug: string;
};

const pickDefault = (variations: ColorOption[]) =>
  variations.find((v) => /standard/i.test(v.color)) ?? variations[0];

// The page's query string (empty while rendering on the server).
const noSubscribe = () => () => {};
const useQueryString = () =>
  useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => "",
  );

export default function ProductView(props: Props) {
  const { name, slug, sku, series, lead, highlights = [], images, variations, inStock } = props;

  // A product card can link here with ?color=… to open on that color.
  const query = useQueryString();
  const requested = useMemo(() => {
    const wanted = new URLSearchParams(query).get("color");
    return variations.find((v) => v.color === wanted);
  }, [query, variations]);

  const [chosen, setChosen] = useState<ColorOption | null>(null);
  const variation = chosen ?? requested ?? pickDefault(variations);
  const pickedColor = chosen !== null || requested !== undefined;
  // Color being hovered (or focused): its photo shows until the pointer leaves.
  const [preview, setPreview] = useState<ColorOption | null>(null);
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

  const current = preview?.image ?? gallery[Math.min(imageIndex, gallery.length - 1)];
  const shownColor = preview ?? variation;
  const price = variation?.price ?? props.price;
  const regularPrice = variation?.regularPrice ?? props.regularPrice;

  const router = useRouter();
  const onAddToCart = () => {
    const item = {
      slug,
      color: variation?.color,
      sku: variation?.sku ?? sku,
      quantity,
      name,
      price,
      image: (variation?.image ?? images[0])?.src,
    };
    addToCart(item);
    track("add_to_cart", { currency: "USD", value: (price * quantity) / 100, items: [gaItem(item)] });
    router.push("/cart/");
  };
  const quoteHref = `/contact-us/?${new URLSearchParams({
    product: name,
    ...(variation ? { color: variation.color } : {}),
    quantity: String(quantity),
  })}`;

  const selectColor = (v: ColorOption) => {
    setChosen(v);
    setImageIndex(0);
  };

  const thumbnails = gallery.length > 1 && (
    <ul
      className="no-scrollbar flex gap-3 overflow-x-auto lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible"
      aria-label="Product photos"
    >
      {gallery.map((img, i) => (
        <li key={img.src} className="shrink-0">
          <button
            type="button"
            onClick={() => setImageIndex(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === imageIndex}
            className={`relative block size-16 overflow-hidden bg-mist outline-offset-2 sm:size-20 ${
              i === imageIndex ? "outline-2 outline-teal" : "opacity-70 hover:opacity-100"
            }`}
          >
            <Image src={img.src} alt="" fill sizes="80px" className="object-contain" />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Gallery: thumbnails down the side on desktop, underneath on phones */}
      <div className="flex min-w-0 flex-col-reverse gap-3 lg:col-span-7 lg:flex-row lg:items-start">
        {thumbnails}
        <div className="relative aspect-square flex-1 overflow-hidden bg-mist">
          {current && (
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              preload
              fetchPriority="high"
              sizes="(min-width: 1600px) 840px, (min-width: 1024px) 52vw, 100vw"
              className="object-contain"
            />
          )}
        </div>
      </div>

      {/* Buy box */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow text-muted">
            {series ? `${series} Series · ` : ""}SKU {variation?.sku ?? sku}
          </p>
          <h1 className="headline mt-3 text-4xl text-deep sm:text-5xl">{name}</h1>

          <div className="mt-5">
            <Price price={price} regularPrice={regularPrice} label={props.priceLabel} size="lg" />
          </div>

          {lead && <p className="mt-5 line-clamp-3 leading-relaxed text-ink/75">{lead}</p>}

          {highlights.length > 0 && (
            <ul className="mt-5 grid gap-2 text-[15px]">
              {highlights.map((h) => (
                <li key={h} className="flex gap-2.5">
                  <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-teal" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {variations.length > 0 && (
            <fieldset className="mt-7">
              <legend className="eyebrow">
                Color: <span className="text-teal">{shownColor?.color}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {variations.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectColor(v)}
                    onMouseEnter={() => setPreview(v)}
                    onMouseLeave={() => setPreview(null)}
                    onFocus={() => setPreview(v)}
                    onBlur={() => setPreview(null)}
                    aria-pressed={v.id === variation?.id}
                    aria-label={v.color}
                    title={v.color}
                    className={`size-9 rounded-full border border-black/15 outline-offset-[3px] transition ${
                      v.id === variation?.id
                        ? "outline-2 outline-teal"
                        : "hover:outline-1 hover:outline-ink/40"
                    }`}
                    style={{ background: v.swatch ?? swatchColor(v.color) }}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-7 flex items-stretch gap-3">
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
              <button type="button" onClick={onAddToCart} className="btn btn-primary flex-1">
                Add to Cart
              </button>
            ) : (
              <span className="btn flex-1 cursor-not-allowed bg-line text-muted">Out of Stock</span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link href={quoteHref} className="btn btn-outline flex-1">
              Request a Quote
            </Link>
            <SaveButton slug={slug} />
          </div>

          <ul className="mt-7 grid grid-cols-3 gap-3 border-t border-line pt-6 text-center text-xs leading-snug text-ink/75">
            <li className="flex flex-col items-center gap-2">
              <FlagIcon className="text-teal" /> Made in the USA
            </li>
            <li className="flex flex-col items-center gap-2">
              <DropIcon className="text-teal" /> Contractor &amp; volume pricing
            </li>
            <li className="flex flex-col items-center gap-2">
              <RulerIcon className="text-teal" /> Installation support
            </li>
          </ul>
          <a
            href={CONTACT.phoneHref}
            className="eyebrow mt-6 flex items-center justify-center gap-2 text-[11px] hover:text-teal"
          >
            <PhoneIcon width={15} height={15} /> Questions? {CONTACT.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
