import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Saloon – Cjenik / Price list" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
