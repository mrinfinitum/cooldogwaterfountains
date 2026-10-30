// Site-wide settings. Content lives in Sanity; checkout runs on Stripe.

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
  src: "/media/dog-water-foutains-logo.png",
  width: 791,
  height: 285,
};

// White-text version for dark backgrounds.
export const LOGO_LIGHT = {
  src: "/media/cooldogwaterfountains_com_logo.png",
  width: 790,
  height: 269,
};

export const HERO_VIDEO = "/media/hero-dog-drinking.mp4";
export const HERO_POSTER = "/media/hero-dog-drinking-poster.jpg";

/** Design images and media stored with the site in /public/media/. */
export const media = (file: string) => `/media/${file}`;

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
