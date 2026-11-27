# Saloon – session handoff

Paste this file's path into the new session ("read HANDOFF.md and continue with Phase 3").

## Goal
Self-standing web app showing the Caffe bar price list (content from `resources/SALOON_A4.pdf`; PDF is content only, not design).
Requirements: runs in browser, login, user management, CMS for items, HTML/CSS frontend, secure, deploy to Vercel later, local preview first, **working folder `D:\Apps\Saloon`**, repo `https://github.com/ivanronga/saloon`. Two languages: Hrvatski + English.

Public table per group (e.g. "Gazirana pića"): **Artikl | Količina | Aktualna cijena | Cijena 31.10.2026.** (Coca-Cola | 0,10 l | 1,60 € | 1,70 €).
The last header is the "Sidrena cijena" (anchored price) and **auto-rolls monthly** to the last day of the previous month (Europe/Zagreb time). Admin must be able to edit every field per item; later add new products under each group. Styling comes after functionality.

## Decisions made
- Stack: **Next.js 15 (App Router, TypeScript)**, Postgres via **Drizzle ORM**. Local preview uses embedded **PGlite** (`.data/pg`, no install); production will use Neon (Phase 7). Plain CSS, no UI framework.
- Auth: **own session code** (not Auth.js): argon2id (`@node-rs/argon2`), session token in HttpOnly SameSite=Lax cookie (Secure in prod), only sha256 of token stored, 7-day TTL, lockout after 5 failed logins / 15 min, identical errors for unknown/wrong/disabled. Roles: `admin`, `editor`. Authorization is checked server-side with `requireUser()` (middleware is only an optimistic gate).
- Seed: PDF price → **anchored price**; current price starts equal; quantity is **free text** (`0,10 l`, `šal./cup`, empty for cocktails). Wine: `0,10 l` = glass, `1,00 l` = bottle (owner confirmed). Items have optional HR/EN notes.
- All points in `seed/REVIEW.md` confirmed OK by owner (incl. my name "Žestoka pića / Spirits" for the shot list, brand spellings left as printed, my EN translations).
- i18n: routes `/hr` and `/en`; `/` redirects by Accept-Language.

## Plan / status
| Phase | Content | Status |
|---|---|---|
| 0 | Scaffold, Drizzle+PGlite, security headers, lint/typecheck/vitest/playwright | **done** |
| 1 | Seed from PDF (125 items, 12 groups), public `/hr` `/en` pages, anchor label | **done** |
| 2 | Login/logout, argon2id, rate limit, protected `/admin`, `create-admin` script | **done** |
| 3 | CMS: edit all item fields inline (name HR/EN, qty, current + anchored price), price history + audit log, revalidate public page | **done** (unit-tested; no e2e for the admin form yet) |
| 4 | CMS: add/delete/reorder items, add/rename/hide/reorder groups | **done** (unit + e2e, all passing) |
| 5 | User management (admin only: create/disable users, roles, reset/change password, never remove last admin) | **done** (unit + e2e passing) |
| 6 | Styling (mobile-first, print stylesheet, a11y, Lighthouse ≥ 90) | **done** except the Lighthouse score, not yet measured |
| 7 | Deploy to Vercel + Neon, env vars (`DATABASE_URL`, `AUTH_SECRET`), smoke tests | todo |

Each phase ends with passing tests (unit/integration with Vitest on in-memory PGlite, e2e with Playwright).
Suggested extras (not yet agreed): price history/audit log (in Phase 3), print/QR cjenik, CSV import/export, manual override of anchor date, optional 2FA, more languages.

## Code map
- `seed/data.ts` (PDF content, tuples `[hr, en, qty, cents, noteHr?, noteEn?]`), `seed/REVIEW.md`
- `src/lib/db/schema.ts` (groups, items, settings, users, sessions, login_attempts), `src/lib/db/index.ts` (`createDb`, `getDb`), migrations in `drizzle/` (`npx drizzle-kit generate`)
- `src/lib/anchor.ts` (`anchorDate`, `anchorLabel`), `money.ts`, `i18n.ts`, `queries.ts`
- `src/lib/auth/` (`password`, `session`, `ratelimit`, `login`, `current` → `requireUser`)
- `src/app/[lang]/page.tsx` public list; `src/app/login/`; `src/app/admin/` (layout requires user; page is placeholder); `src/middleware.ts`
- `scripts/seed.ts`, `scripts/create-admin.ts`; tests in `tests/` (vitest) and `e2e/` (playwright)
- Tables still to add in Phase 3: `price_history`, `audit_log`.

## Run locally (Node 20+)
```bash
git fetch && git checkout claude/hopeful-archimedes-kp9k1g
npm install
npm run seed
npm run create-admin     # email + password (min 12 chars)
npm run dev              # http://localhost:3000  (/hr, /en, /login)
npm run check            # lint + typecheck + unit tests  (30 tests)
npm run e2e              # 10 browser tests (isolated: port 3100, .data/e2e); first time: npx playwright install chromium
```
(In the cloud sandbox e2e needs `PW_CHROMIUM=/opt/pw-browsers/chromium`; not needed locally.)

## Git state
Work is on branch `claude/hopeful-archimedes-kp9k1g` (3 commits ahead of `main`: Phase 0-1, Phase 2, this handoff). `main` only has README + PDF. No PR created yet; merge when the owner asks.

## Notes / open items
- Tell new session to work directly in `D:\Apps\Saloon` (folder shared via Remote Control) – the earlier session could not reach it and worked in a cloud clone.
- `npm install` reported audit warnings; run `npm audit` and review in Phase 7 at the latest.
- Public page is `force-dynamic` for now; switch to cached + `revalidatePath` after CMS saves (Phase 3).
- Security checklist to keep verifying: Zod validation on every action, authz in every server action, CSP header still to add (only basic headers exist), no secrets in repo.

## Phase 6 notes
- App Router now has two root layouts: `src/app/[lang]/layout.tsx` (public, `<html lang>` follows the URL) and `src/app/(cms)/layout.tsx` (admin + login). `/` redirects to `/hr` via `next.config.ts`; there is no `src/app/layout.tsx`.
- Favicon: `src/app/icon.svg` (built from `resources/icon.svg` on a dark rounded square). Logo: `public/logo.png` (copy of `resources/logo.png`).
- Public page: skip link, sticky "jump to group" bar, print stylesheet (A4, logo inverted), per-language title/description/hreflang.
- Phase 7: public page is still `force-dynamic`. For Vercel consider ISR (`revalidate = 3600`, since the anchor label depends on the month) and re-check `revalidatePath` after CMS saves.
