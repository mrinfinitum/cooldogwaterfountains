// Fallback swatch colors by finish name (used when a color has no swatch set in Sanity).
const SWATCHES: [RegExp, string][] = [
  [/silver|grey|gray/i, "#b9c0c4"],
  [/aqua/i, "#3fb7c9"],
  [/blue/i, "#1f6fb5"],
  [/green/i, "#2f6b4f"],
  [/pink/i, "#f2a6c3"],
  [/earth/i, "#8a735e"],
  [/white|bone/i, "#efe9dc"],
  [/mustard/i, "#d3a02a"],
  [/yellow/i, "#f2c632"],
  [/red/i, "#c23b32"],
  [/black/i, "#1d1d1b"],
];

export function swatchColor(name: string): string {
  return SWATCHES.find(([pattern]) => pattern.test(name))?.[1] ?? "#cddfdd";
}
