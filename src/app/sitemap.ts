import type { MetadataRoute } from "next";
import { LANGS } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.map((l) => ({
    url: `${SITE_URL}/${l}`,
    alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${SITE_URL}/${x}`])) },
  }));
}
