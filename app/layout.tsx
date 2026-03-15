import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "Cuttie - AI Personal Styling & Beauty Preview",
  description: "AI-powered personal styling assistant for makeup try-on, hairstyle simulation, and digital wardrobe styling",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${syne.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
