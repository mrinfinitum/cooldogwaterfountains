import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Mono, Hanken_Grotesk } from "next/font/google";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_URL, WP_URL } from "@/lib/site";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

const label = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dog Water Fountains | Cool Dog Water Fountains",
    template: "%s | Cool Dog Water Fountains",
  },
  description:
    "Quality dog water fountains for dog parks, apartments, condos, HOAs, vet clinics and daycares. Made in the USA with contractor pricing.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: `${WP_URL}/wp-content/uploads/2022/04/cropped-dog-water-fountain-favicon-192x192.png`,
    apple: `${WP_URL}/wp-content/uploads/2022/04/cropped-dog-water-fountain-favicon-180x180.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a3550",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${label.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="eyebrow sr-only z-50 bg-white px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AnnouncementBar />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
