import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: "title",
      title: "Search title",
      type: "string",
      description: "Shown in Google and browser tabs. Aim for 50–60 characters.",
      validation: (rule) =>
        rule.max(70).warning("Over 70 characters gets cut off in search results."),
    }),
    defineField({
      name: "description",
      title: "Meta description",
      type: "text",
      rows: 3,
      description: "Shown under the title in Google. Aim for 120–158 characters.",
      validation: (rule) =>
        rule.min(70).max(165).warning("Search engines show roughly 120–158 characters."),
    }),
    defineField({
      name: "focusKeyphrase",
      title: "Focus keyphrase",
      type: "string",
      description: "The main search phrase this page should rank for (for your reference).",
    }),
    defineField({
      name: "noindex",
      title: "Hide from search engines",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
