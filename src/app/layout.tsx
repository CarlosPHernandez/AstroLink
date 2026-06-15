import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { DeferredMaterialSymbols } from "@/components/landing/deferred-material-symbols";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "AstroLink",
    template: "%s · AstroLink",
  },
  description:
    "Book verified aerospace experts for live 1:1 video sessions — astronauts, flight controllers, and operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DeferredMaterialSymbols />
        {children}
      </body>
    </html>
  );
}
