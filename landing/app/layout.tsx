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
  title: "KABPRO - Commercial Fleet & Logistics Management",
  description:
    "Manage department contracts, trip profits, FASTag, fuel logs, and compliance from one dashboard. Built for Indian fleet operators.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "KABPRO - Commercial Fleet & Logistics Management",
    description:
      "Your entire fleet. One dashboard. Department billing, trip profitability, compliance alerts, and more.",
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
