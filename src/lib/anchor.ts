export type Lang = "hr" | "en";
const TZ = "Europe/Zagreb";

/** Last day of the previous month (venue time zone) — the "sidrena cijena" date. */
export function anchorDate(today: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "numeric" })
    .formatToParts(today);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value); // 1-12, current month
  const d = new Date(Date.UTC(year, month - 1, 0)); // day 0 => last day of previous month
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

const MONTHS_HR = ["siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function anchorLabel(lang: Lang, today?: Date): { date: string; month: string } {
  const a = anchorDate(today);
  if (lang === "hr") return { date: `${a.day}.${a.month}.${a.year}.`, month: MONTHS_HR[a.month - 1] };
  return { date: `${a.day} ${MONTHS_EN[a.month - 1].slice(0, 3)} ${a.year}`, month: MONTHS_EN[a.month - 1] };
}
