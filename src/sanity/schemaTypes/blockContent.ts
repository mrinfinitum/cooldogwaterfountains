import { defineArrayMember, defineField, defineType } from "sanity";

/** Rich text used for page bodies and product descriptions. */
export const blockContent = defineType({
  name: "blockContent",
  title: "Content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Heading 4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullets", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Underline", value: "underline" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "url",
                description: "Use /page-name/ for pages on this site.",
                validation: (rule) =>
                  rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
              }),
              defineField({
                name: "button",
                title: "Show as a button",
                type: "boolean",
                initialValue: false,
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt text", type: "string" }),
        defineField({
          name: "href",
          title: "Link (optional)",
          type: "url",
          validation: (r) => r.uri({ allowRelative: true }),
        }),
      ],
    }),
    defineArrayMember({
      name: "imageGrid",
      title: "Image grid",
      type: "object",
      fields: [
        defineField({
          name: "images",
          type: "array",
          of: [
            defineArrayMember({
              type: "image",
              fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
            }),
          ],
        }),
      ],
      preview: {
        select: { images: "images", media: "images.0" },
        prepare: ({ images, media }) => ({ title: `Image grid (${images?.length ?? 0})`, media }),
      },
    }),
  ],
});
