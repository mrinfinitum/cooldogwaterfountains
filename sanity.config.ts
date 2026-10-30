"use client";

/**
 * Sanity Studio, served by this Next.js app at /studio.
 * Editors manage the home page, products, categories and pages here.
 */
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

const SINGLETONS = new Set(["homePage"]);

export default defineConfig({
  name: "cool-dog-water-fountains",
  title: "Cool Dog Water Fountains",
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // The home page is a single document: hide it from "create new".
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(
            ({ action }) => action && ["publish", "discardChanges", "restore"].includes(action),
          )
        : actions,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Home page")
              .id("homePage")
              .child(S.document().schemaType("homePage").documentId("homePage")),
            S.divider(),
            S.documentTypeListItem("product").title("Products"),
            S.documentTypeListItem("category").title("Categories"),
            S.documentTypeListItem("page").title("Pages"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
