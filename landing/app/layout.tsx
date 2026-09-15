import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "KABPRO - Fleet software for Indian cab operators",
  description:
    "Department billing, trip profit, FASTag, fuel logs, and compliance alerts in one dashboard. Built for Indian fleet operators.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "KABPRO - Fleet software for Indian cab operators",
    description:
      "Department billing, trip profit, FASTag, fuel logs, and compliance alerts in one dashboard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans bg-bg text-body antialiased overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
