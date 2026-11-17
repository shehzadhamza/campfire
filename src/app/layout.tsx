import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700"] });
const body = DM_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Campfire",
  description: "Keep the fire going with the guys you care about.",
  appleWebApp: { capable: true, title: "Campfire", statusBarStyle: "black-translucent" },
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg`, apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icons/180.png` },
};

export const viewport: Viewport = {
  themeColor: "#0a0c11",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
