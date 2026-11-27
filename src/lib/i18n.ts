import { anchorLabel, type Lang } from "./anchor";

export const LANGS: Lang[] = ["hr", "en"];
export const isLang = (s: string): s is Lang => (LANGS as string[]).includes(s);

export function t(lang: Lang, today?: Date) {
  const a = anchorLabel(lang, today);
  return lang === "hr"
    ? { title: "Cjenik", item: "Artikl", qty: "Količina", current: "Aktualna cijena", anchor: `Cijena ${a.date}`, anchorNote: `Sidrena cijena (${a.month})` }
    : { title: "Price list", item: "Item", qty: "Quantity", current: "Current price", anchor: `Price ${a.date}`, anchorNote: `Anchored price (${a.month})` };
}
