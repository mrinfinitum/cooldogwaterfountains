import { TagIcon } from "@sanity/icons/Tag";
import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Product category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      description: "Page address: /prod-category/<slug>/",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "isSeries",
      title: "Product series",
      type: "boolean",
      description: "Series (SST, SLV, Shelter Strong) are listed separately from product types.",
      initialValue: false,
    }),
    defineField({ name: "order", title: "Sort order", type: "number" }),
    defineField({ name: "seo", type: "seo" }),
  ],
  orderings: [{ title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", media: "image", series: "isSeries" },
    prepare: ({ title, media, series }) => ({
      title,
      subtitle: series ? "Series" : "Product type",
      media,
    }),
  },
});
