// Swatch colors for the fountain finishes named in WooCommerce.
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

// Words used in photo file names for each finish, e.g. "…-SLV-BlueAqua-WM.jpg".
const PHOTO_NAMES: [color: RegExp, filename: RegExp][] = [
  [/bone|white/i, /bone-?white|white/i],
  [/speckled|earth/i, /speck|earth/i],
  [/pink/i, /pink/i],
  [/mustard/i, /mustard/i],
  [/yellow/i, /ylw|yellow/i],
  [/green/i, /green|grn|greee/i],
  [/aqua|blue/i, /aqua|blu/i],
  [/silver|grey|gray/i, /silver|slv-slv/i],
];

// Paint-chip and color-card images rather than photos of a fountain.
const CHIP = /cool-dog-water-fountains-|tiger|ral-\d|spackle|pearl|custom-?colors/i;

/** Whether a photo's file name says it shows the fountain in this color. */
export function photoMatchesColor(url: string, color: string): boolean {
  const file = decodeURIComponent(url.split("/").pop() ?? "");
  if (CHIP.test(file)) return false;
  const entry = PHOTO_NAMES.find(([c]) => c.test(color));
  return entry ? entry[1].test(file) : false;
}
