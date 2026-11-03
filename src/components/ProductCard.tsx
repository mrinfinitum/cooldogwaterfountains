import type { Product } from "@/lib/content";
import ProductCardView from "./ProductCardView";

/** Product tile for grids; passes only what the card needs to the browser. */
export default function ProductCard({
  product,
  priority,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { slug, sku, name, price, regularPrice, onSale, images, options } = product;
  return (
    <ProductCardView
      product={{ slug, sku, name, price, regularPrice, onSale, images: images.slice(0, 2), options }}
      priority={priority}
    />
  );
}
