import { HomeIcon } from "@sanity/icons/Home";
import { defineArrayMember, defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "productLines",
      title: "Shop by fountain",
      type: "array",
      description: "Cards in the 'Shop by fountain' grid, in order.",
      of: [
        defineArrayMember({
          name: "productLine",
          type: "object",
          fields: [
            defineField({ name: "title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "subtitle", type: "string" }),
            defineField({ name: "image", type: "image", options: { hotspot: true } }),
            defineField({
              name: "category",
              title: "Links to category",
              type: "reference",
              to: [{ type: "category" }],
            }),
          ],
          preview: { select: { title: "title", subtitle: "subtitle", media: "image" } },
        }),
      ],
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
