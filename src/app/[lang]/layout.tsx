import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { isLang, LANGS, t } from "@/lib/i18n";
import "../globals.css";

export const viewport: Viewport = { themeColor: "#0e0f12" };

const DESCRIPTION = {
  hr: "Cjenik Saloon Caffe Bar – aktualne cijene pića.",
  en: "Saloon Caffe Bar price list – current drink prices.",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: `Saloon Caffe Bar – ${t(lang).title}`,
    description: DESCRIPTION[lang],
    alternates: { canonical: `/${lang}`, languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}`])) },
  };
}

/** Root layout of the public site: `<html lang>` follows the URL so screen readers and search engines get the right language. */
export default async function PublicRootLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
