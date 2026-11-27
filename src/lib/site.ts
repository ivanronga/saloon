/** Public origin used for canonical / hreflang / sitemap URLs. Set SITE_URL in production (Phase 7). */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
