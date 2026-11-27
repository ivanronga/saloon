import type { ReactNode } from "react";
import type { Viewport } from "next";
import "../globals.css";

export const metadata = { title: "Saloon", robots: { index: false } };
export const viewport: Viewport = { themeColor: "#0e0f12" };

export default function CmsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
