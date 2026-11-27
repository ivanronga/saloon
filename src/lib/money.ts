import type { Lang } from "./anchor";

export function formatMoney(cents: number | null | undefined, lang: Lang): string {
  if (cents == null) return "–";
  const v = cents / 100;
  return lang === "hr"
    ? `${new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} €`
    : `€${new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
}
