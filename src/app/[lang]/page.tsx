import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getPriceList, getSetting } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { isLang, LANGS, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function PriceListPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const db = await getDb();
  const [list, rawTexts] = await Promise.all([getPriceList(db), getSetting(db, "site_texts")]);
  const texts = rawTexts ? JSON.parse(rawTexts) : null;
  const L = t(lang);

  return (
    <main className="wrap">
      <header className="top">
        <h1>Saloon <span>{L.title}</span></h1>
        <nav aria-label="Language">
          {LANGS.map((l) => (
            <Link key={l} href={`/${l}`} aria-current={l === lang ? "true" : undefined}>
              {l.toUpperCase()}
            </Link>
          ))}
        </nav>
      </header>

      {list.map((g) => (
        <section key={g.id} aria-labelledby={`g${g.id}`}>
          <h2 id={`g${g.id}`}>{lang === "hr" ? g.nameHr : g.nameEn}</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">{L.item}</th>
                <th scope="col">{L.qty}</th>
                <th scope="col" className="num">{L.current}</th>
                <th scope="col" className="num" title={L.anchorNote}>{L.anchor}</th>
              </tr>
            </thead>
            <tbody>
              {g.items.map((i) => {
                const note = lang === "hr" ? i.noteHr : i.noteEn;
                return (
                  <tr key={i.id}>
                    <td>
                      {lang === "hr" ? i.nameHr : i.nameEn}
                      {note ? <small className="note">{note}</small> : null}
                    </td>
                    <td>{i.qtyText}</td>
                    <td className="num">{formatMoney(i.priceCents, lang)}</td>
                    <td className="num">{formatMoney(i.anchorPriceCents, lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}

      {texts && (
        <footer>
          <p><strong>{texts.thanks[lang]}</strong></p>
          {texts.notices[lang].map((n: string) => <p key={n}>{n}</p>)}
          <p>{texts.company}</p>
        </footer>
      )}
    </main>
  );
}
