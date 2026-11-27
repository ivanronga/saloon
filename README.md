# Saloon – price list

Bilingual (HR/EN) price list for the Caffe bar, with login, user management and a CMS (in progress).
Content source: `resources/SALOON_A4.pdf` (content only, not design). Plan phases: scaffold → public list → auth → CMS edit → CMS add/reorder → users → styling → Vercel deploy.

## Local preview (Windows/macOS/Linux, Node 20+)

```bash
npm install
npm run seed      # creates .data/ (embedded Postgres) and loads the PDF content
npm run create-admin   # asks for email + password (min 12 chars); creates the first admin
npm run dev       # http://localhost:3000  (/hr, /en; admin at /login)
```

## Checks

```bash
npm run check     # lint + typecheck + unit tests
npm run e2e       # Playwright (first time: npx playwright install chromium)
```

`seed/REVIEW.md` lists assumptions made while transcribing the PDF – please confirm them.
