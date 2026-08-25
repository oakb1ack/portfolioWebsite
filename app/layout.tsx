import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter, SiteHeader } from "@/components";
import { site } from "@/lib/data";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: site.url,
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "Ali Alfridawi — Mathematics and Electrical Engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/og-card.png"],
  },
  icons: { icon: "/favicon.svg" },
};

const footerLinks = [
  ...site.profiles.map(({ label, href }) => ({ label, href, external: true })),
  { label: "Email", href: `mailto:${site.email}`, external: false },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  email: `mailto:${site.email}`,
  sameAs: site.profiles.map(({ href }) => href),
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "University of Texas at Arlington",
  },
  knowsAbout: [
    "Mathematics",
    "Electrical engineering",
    "Reliable systems",
    "Software engineering",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
          }}
        />
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        <SiteHeader items={site.navigation} name={site.name} />
        <main id="main-content">{children}</main>
        <SiteFooter links={footerLinks} name={site.name} />
      </body>
    </html>
  );
}
