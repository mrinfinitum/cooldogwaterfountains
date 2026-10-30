import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      description: "Page address: /<slug>/",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Banner photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "body", type: "blockContent" }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: {
    select: { title: "title", slug: "slug.current", media: "heroImage" },
    prepare: ({ title, slug, media }) => ({ title, subtitle: `/${slug ?? ""}/`, media }),
  },
});
