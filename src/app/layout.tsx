import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getProductionAppUrl } from "@/lib/app-url";
import {
  defaultSiteOgImage,
  defaultSiteTwitterImage,
} from "@/lib/seo/og-images";
import "./globals.css";

const SITE_DESCRIPTION =
  "Book verified aerospace experts for live 1:1 video sessions — astronauts, flight controllers, and operators.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(getProductionAppUrl()),
  title: {
    default: "AstroLink",
    template: "%s · AstroLink",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "AstroLink",
    description: SITE_DESCRIPTION,
    siteName: "AstroLink",
    type: "website",
    images: [defaultSiteOgImage()],
  },
  twitter: {
    ...defaultSiteTwitterImage(),
    title: "AstroLink",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9fe",
  colorScheme: "light",
  // Lets sticky header / footer use env(safe-area-inset-*) on notched phones.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${montserrat.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}