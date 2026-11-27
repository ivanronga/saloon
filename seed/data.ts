// Seed content transcribed from resources/SALOON_A4.pdf (content only).
// Prices are the PDF prices => seeded as the anchored (31.10.) price.
// Item tuple: [name_hr, name_en, qty_text, price_cents, note_hr?, note_en?]
export type SeedItem = [string, string, string, number, string?, string?];
export type SeedGroup = { hr: string; en: string; items: SeedItem[] };

const same = (n: string, q: string, p: number, nh?: string, ne?: string): SeedItem => [n, n, q, p, nh, ne];
const S = "0,03 l";

export const groups: SeedGroup[] = [
  {
    hr: "Gazirana pića", en: "Carbonated drinks",
    items: [
      same("Coca-Cola", "0,10 l", 170), same("Coca-Cola", "0,25 l", 280),
      same("Coca-Cola Zero Sugar", "0,25 l", 280),
      ["Fanta Orange (naranča)", "Fanta Orange (orange)", "0,10 l", 170],
      ["Fanta Orange (naranča)", "Fanta Orange (orange)", "0,25 l", 280],
      same("Sprite", "0,10 l", 170), same("Sprite", "0,25 l", 280),
      same("Schweppes", "0,25 l", 280, "Tonic Water, Bitter Lemon, Tangerine, Pink Grapefruit, Purple Tonic Style", "Tonic Water, Bitter Lemon, Tangerine, Pink Grapefruit, Purple Tonic Style"),
      same("Monster", "0,355 l", 300), same("Cockta", "0,275 l", 280),
      same("Orangina", "0,25 l", 280), same("RedBull", "0,25 l", 340),
    ],
  },
  {
    hr: "Negazirana pića", en: "Non-carbonated drinks",
    items: [
      same("Cappy", "0,20 l", 280, "naranča, jabuka, marelica, breskva, crni ribiz, jagoda", "orange, apple, apricot, peach, blackcurrant, strawberry"),
      same("Cedevita", "vreć./sach.", 200),
      ["Jana ledeni čaj", "Jana ice tea", "0,25 l", 280],
      ["Cijeđena naranča", "Squeezed orange", "0,20 l", 280],
      ["Limunada", "Lemonade", "0,20 l", 280],
      ["Grejp prirodni", "Natural grapefruit", "0,20 l", 220],
      same("Jana vitamin", "", 280),
    ],
  },
  {
    hr: "Prirodna mineralna voda", en: "Natural mineral water",
    items: [
      ["Römerquelle", "Römerquelle", "0,33 l", 250, "negazirana prirodna mineralna voda", "still natural mineral water"],
      ["Römerquelle", "Römerquelle", "0,33 l", 250, "gazirana prirodna mineralna voda", "sparkling natural mineral water"],
      ["Römerquelle Emotion", "Römerquelle Emotion", "0,33 l", 260, "gazirana mineralna voda s okusom (limunska trava)", "flavored sparkling natural mineral water (lemongrass)"],
      same("Jamnica", "0,10 l", 70), same("Jamnica", "0,33 l", 250),
      ["Jamnica okusi", "Jamnica flavored", "0,33 l", 280],
    ],
  },
  {
    hr: "Kava", en: "Coffee",
    items: [
      ["Kava", "Coffee", "šal./cup", 190],
      ["Kava sa šlagom", "Coffee with whipped cream", "šal./cup", 190],
      ["Kava s mlijekom", "Coffee with milk", "šal./cup", 190],
      ["Bezkofeinska kava", "Decaf. coffee", "šal./cup", 190],
      ["Bijela kava", "White coffee", "šal./cup", 220],
      ["Ledena kava", "Ice coffee", "šal./cup", 220],
      same("COFFEE TO GO!", "šal./cup", 190),
      ["Dupla kava", "Double coffee", "šal./cup", 380],
      ["Coca-Cola 0,25 l + Kava", "Coca-Cola 0,25 l + coffee", "", 340],
    ],
  },
  {
    hr: "Topli napitci", en: "Warm drinks",
    items: [
      same("Cappuccino", "šal./cup", 200),
      ["Kakao", "Cocoa", "šal./cup", 220],
      ["Topla čokolada", "Hot chocolate", "šal./cup", 220],
      ["Čaj", "Tea", "šal./cup", 200],
      same("Nescafe", "šal./cup", 220),
    ],
  },
  { hr: "Dodaci", en: "Extras", items: [["Med", "Honey", "", 13]] },
  {
    hr: "Pivo", en: "Beer",
    items: [
      same("Karlovačko", "0,50 l", 300), same("Karlovačko", "0,33 l", 320),
      ["Karlovačko limun", "Karlovačko lemon", "0,50 l", 300],
      ["Karlovačko crni", "Karlovačko dark", "0,50 l", 300],
      same("Laško", "0,50 l", 300), same("Krušovice", "0,50 l", 300),
      same("Heineken 0/0", "0,25 l", 300), same("Heineken", "0,25 l", 300),
      same("Stari Lisac", "0,50 l", 300), same("Pils", "0,50 l", 190),
      same("Brundelweiss", "0,50 l", 260), same("Brundelweiss", "0,30 l", 180),
    ],
  },
  {
    hr: "Vino", en: "Wine",
    items: [
      same("Pelješac", "0,187 l", 270),
      ["Bijelo vino", "White wine", "0,10 l", 170], ["Crno vino", "Red wine", "0,10 l", 170],
      ["Bijelo vino", "White wine", "1,00 l", 1700], ["Crno vino", "Red wine", "1,00 l", 1700],
      same("Pol-pol", "0,20 l", 210), same("Pol-pol", "0,30 l", 280),
      same("Bambus", "0,20 l", 310), same("Bambus", "0,30 l", 400),
      same("Strongbow", "0,33 l", 200),
      ["Kuhano vino bijelo", "Mulled white wine", "", 340],
      ["Kuhano vino crno", "Mulled red wine", "", 400],
    ],
  },
  {
    hr: "Domaća žestoka", en: "Domestic liquor",
    items: [
      same("Pelinkovac Antique", S, 250), same("Medica", S, 200), same("Višnjevac", S, 220),
      ["Pelin + Coca-Cola", "Pelin + Coca-Cola", "", 350],
      same("Gin + tonic", "", 350),
      ["Vodka + sok", "Vodka + juice", "", 350],
    ],
  },
  {
    hr: "Strana žestoka", en: "Imported liquor",
    items: [
      same("Jack Daniel’s Old No. 7", S, 320), same("Gentleman Jack", S, 320),
      same("Jack Daniel’s Tennessee Honey", S, 300), same("Finalandia vodka", S, 220),
      same("Bacardi", S, 240), same("Martini", "0,10 l", 240),
      same("Stock", S, 220), same("Pelinkovac", "0,10 l", 220),
    ],
  },
  {
    // Header not visible in the PDF text layer; name to be confirmed by the owner.
    hr: "Žestoka pića", en: "Spirits",
    items: [
      ["Lavov", 220], ["Konjak", 220], ["Travarica", 220], ["Lozovača", 220], ["Kruškovac", 220],
      ["Šljivovica", 220], ["Amaro", 220], ["Rum", 220], ["Vodka", 220], ["Absolit vodka", 220],
      ["Gin", 220], ["Orahovac", 220], ["Keglevich", 220], ["Vigor voćna", 220], ["Dalmatino", 220],
      ["Baileys", 250], ["Malibu", 240], ["Blacky", 240], ["Pina Colada", 220], ["Gin Tanqery", 220],
      ["Hendricks gin", 220], ["Sax", 240], ["Sax Pink", 240], ["Jägermeister", 240], ["Viljamovka", 220],
      ["Campari", 240], ["Tequila", 240], ["Smirnof", 220], ["Ballantines", 220], ["Johnny Walker", 320],
      ["Chivas Regal", 320], ["Jameson", 320], ["Southern Comfort", 320], ["Martell", 350],
      ["Courvoisier", 350], ["Hennessy", 350], ["Red Label", 270], ["Crazy shot", 200], ["Vampire Worm shot", 200],
    ].map(([n, p]) => same(n as string, S, p as number)),
  },
  {
    hr: "Kokteli", en: "Cocktails",
    items: ["Blue Lagoon", "Sex on the Beach", "Mojito", "Cuba Libre", "Hugo", "Long Island", "Blue Hawaii", "Saloon"]
      .map((n) => same(n, "", 500)),
  },
];

export const siteTexts = {
  company: "FRONT LINE j.d.o.o., Vijenac kardinala Alojzija Stepinca 7, 31400 Đakovo, OIB: 05347213652",
  thanks: { hr: "Hvala na posjeti!", en: "Thank you for visiting!" },
  notices: {
    hr: [
      "Zabranjeno usluživanje, odnosno konzumiranje alkoholnih pića i/ili napitaka koji sadržavaju alkohol u ugostiteljskom objektu osobama mlađim od 18 godina.",
      "Zabranjena je prodaja cigareta i duhanskih proizvoda maloljetnicima.",
      "Usluga, PDV i ostali porezi su uračunati u cijenu. Plaćanje gotovinom.",
      "Informacije o podnošenju prigovora nalaze se na šanku.",
    ],
    en: [
      "It is prohibited to serve or allow consumption of alcoholic drinks, beverages and/or other drinks containing alcohol to persons under the age of 18.",
      "It is forbidden to sell cigarettes and tobacco products to underaged persons.",
      "Services, VAT and other taxes are included in the price. Cash payment.",
      "Information about submitting complaints can be found at the bar.",
    ],
  },
};
