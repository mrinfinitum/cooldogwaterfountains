import { PackageIcon } from "@sanity/icons/Package";
import { defineArrayMember, defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "colors", title: "Colors" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      group: "details",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      group: "details",
      description: "Page address: /fountain/<slug>/",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "sku", title: "SKU", type: "string", group: "details" }),
    defineField({
      name: "price",
      title: "Price (USD)",
      type: "number",
      group: "details",
      description: "What the customer pays at checkout.",
      validation: (r) => r.required().min(0).precision(2),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Regular price (USD)",
      type: "number",
      group: "details",
      description: "Optional. Shown crossed out next to the price.",
      validation: (r) => r.min(0).precision(2),
    }),
    defineField({
      name: "priceLabel",
      title: "Price label",
      type: "string",
      group: "details",
      initialValue: "Contractor Price",
    }),
    defineField({
      name: "inStock",
      title: "In stock",
      type: "boolean",
      group: "details",
      initialValue: true,
    }),
    defineField({ name: "summary", type: "text", rows: 3, group: "details" }),
    defineField({ name: "description", type: "blockContent", group: "details" }),
    defineField({
      name: "images",
      title: "Photos",
      type: "array",
      group: "details",
      description: "The first photo is the main one.",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
        }),
      ],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: "categories",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "reference", to: [{ type: "category" }] })],
    }),
    defineField({
      name: "taxCode",
      title: "Stripe Tax code",
      type: "string",
      group: "details",
      description: "Stripe product tax code. txcd_99999999 = general tangible goods.",
      initialValue: "txcd_99999999",
    }),
    defineField({
      name: "colors",
      title: "Color options",
      type: "array",
      group: "colors",
      description: "The first color marked Standard (or the first color) is selected by default.",
      of: [
        defineArrayMember({
          name: "colorOption",
          type: "object",
          fields: [
            defineField({ name: "name", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "swatch",
              title: "Swatch color (hex)",
              type: "string",
              description: "e.g. #1f6fb5",
              validation: (r) => r.regex(/^#[0-9a-f]{6}$/i, { name: "hex color" }),
            }),
            defineField({
              name: "image",
              title: "Photo in this color",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "price",
              title: "Price for this color (USD)",
              type: "number",
              description: "Leave empty to use the product price.",
            }),
          ],
          preview: { select: { title: "name", media: "image", subtitle: "swatch" } },
        }),
      ],
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      group: "details",
      description: "Lower numbers are listed first.",
    }),
    defineField({ name: "seo", type: "seo", group: "seo" }),
  ],
  orderings: [{ title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", subtitle: "sku", media: "images.0", price: "price" },
    prepare: ({ title, subtitle, media, price }) => ({
      title,
      subtitle: [subtitle, price != null ? `$${price.toLocaleString("en-US")}` : null]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
