// Site-wide settings. WordPress stays the CMS; this app is the front end.

export const WP_URL = (
  process.env.WORDPRESS_URL ?? "https://www.cooldogwaterfountains.com"
).replace(/\/$/, "");

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cooldogwaterfountains.com"
).replace(/\/$/, "");

export const SITE_NAME = "Cool Dog Water Fountains";

export const CONTACT = {
  phone: "800.931.1562",
  phoneHref: "tel:8009311562",
  fax: "800.931.6152",
  email: "sales@gymsfordogs.com",
  hours: "8:00 AM – 5:00 PM EST",
  days: "Monday – Friday",
};

export const LOGO = {
  src: `${WP_URL}/wp-content/uploads/2021/09/dog-water-foutains-logo.png`,
  width: 791,
  height: 285,
};

// White-text version for dark backgrounds.
export const LOGO_LIGHT = {
  src: `${WP_URL}/wp-content/uploads/2022/01/cooldogwaterfountains_com_logo.png`,
  width: 790,
  height: 269,
};

export const HERO_VIDEO = `${WP_URL}/wp-content/uploads/2025/01/1912203_Thirsty_Dog_1920x1080.mp4`;

export const upload = (path: string) => `${WP_URL}/wp-content/uploads/${path}`;

// Cart, checkout and accounts stay on WordPress / WooCommerce.
export const cartUrl = () => `${WP_URL}/cart/`;
export const checkoutUrl = () => `${WP_URL}/checkout/`;

export const RESOURCE_LINKS = [
  { href: "/dog-water-fountain-colors/", label: "Colors" },
  { href: "/dog-water-fountain-plumbing/", label: "Plumbing" },
  { href: "/water-fountain-install/", label: "Installation – Basin Fountains" },
  {
    href: "/installation-fresh-flow-fountains/",
    label: "Installation – Fresh Flow Fountains",
  },
  { href: "/dog-park-designs/", label: "Dog Park Designs" },
  { href: "/dog-water-fountain-resources/", label: "Architects & Contractors" },
];

export const COMPANY_LINKS = [
  { href: "/dog-water-fountain-mission/", label: "Our Mission" },
  { href: "/dogs-love-water/", label: "Dogs Love Water" },
  { href: "/contact-us/", label: "Contact Us" },
];

export const LEGAL_LINKS = [
  { href: "/dog-water-fountains-policy/", label: "Privacy Policy" },
  { href: "/dog-water-fountains-terms/", label: "Terms & Conditions" },
];

// Category slugs that describe a series rather than a product type.
export const SERIES_CATEGORIES = [
  "dog-water-fountain-sst",
  "dog-water-fountain-slv",
  "shelter-strong",
];
