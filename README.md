# UPD Card Generator — ورشة بريق الشاحنات

Issues **Unique Under-run Protection Device (UPD) cards** for trucks and trailers.

Each card:

- has a unique public ID,
- is rendered as an exact replica of the official bilingual (Arabic + English) PDF,
- carries a QR code that opens a **public verification page** (`/verify/<id>`), where anyone can confirm it is genuine.

The admin side is protected by email and password login (Supabase Auth). The app's own interface is available in **English** (the default), **Arabic** and **Urdu**.

Stack: Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres + Auth) · `qrcode` · `nanoid` · `html-to-image` + `jspdf`.

---

## 1. Run locally (no setup needed)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. With **no environment variables set**, the dev server runs in **local dev mode**:

- there is no login screen,
- cards are saved to `.data/cards.json`. The folder is git-ignored; delete it to clear the test cards.

This mode only exists under `npm run dev`. A production build never falls back to it.

To use the real database and login locally, finish section 2, copy `.env.example` to `.env.local`, fill it in and restart `npm run dev`.

## 2. Supabase setup (database + login)

1. **Create a project.** Go to <https://supabase.com> → **New project**. The free plan is enough. Pick a region close to Saudi Arabia (e.g. Frankfurt or Mumbai) and save the database password somewhere safe.
2. **Create the table.** Open **SQL Editor** → **New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), then click **Run**. This creates `upd_cards` with row-level security **on** and **no policies**, so only the server (using the secret key) can read or write cards.
3. **Copy the keys.** Go to **Project Settings** → **API Keys** and copy:
   - the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - the **publishable key** (`sb_publishable_…`), or the legacy **anon** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - a **secret key** (`sb_secret_…`), or the legacy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`. **Keep this private.**
4. **Turn off public sign-ups.** Go to **Authentication** → **Sign In / Providers** and switch off **"Allow new users to sign up"**. Only accounts you create yourself can then exist. (The app also refuses any account missing from `ADMIN_EMAILS`, so this is a second lock.)
5. **Create the first admin user.**
   1. Go to **Authentication** → **Users** → **Add user** → **Create new user**.
   2. Enter the admin's email and a strong password.
   3. Tick **Auto Confirm User**. Unconfirmed emails are refused at login.
   4. Add that email to `ADMIN_EMAILS` (step 6). To add more admins, repeat this and add each email, comma-separated.
6. **Set the environment variables.** Fill in all five variables described in [`.env.example`](.env.example), in `.env.local` (local) and on Vercel (production):

   | Variable | What it is |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key, used for login. It's safe to be public. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key. Used only by the server; **never expose or commit it.** |
   | `ADMIN_EMAILS` | Comma-separated admin emails. Empty means nobody can log in. |
   | `NEXT_PUBLIC_SITE_URL` | Your public domain, printed into every QR code (see section 4). |

Password resets: an admin can't reset their own password from the app. Change it in **Authentication** → **Users** → (user) → **Send password recovery**, or delete the user and create them again.

> Free Supabase projects **pause after about a week with no activity**. If the site suddenly can't log in or verify cards,
> open the Supabase dashboard and click **Restore project**.

## 3. Deploy to Vercel (free)

1. **Put the code on GitHub.** Create an empty **private** repository on github.com, then from this folder run:

   ```bash
   git init
   ```

   ```bash
   git add -A
   ```

   ```bash
   git commit -m "UPD Card Generator"
   ```

   ```bash
   git branch -M main
   ```

   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   ```

   ```bash
   git push -u origin main
   ```

   `.env.local`, `.data/` and `node_modules/` are git-ignored, so no secrets or test data get pushed. The reference files (PDF, screenshot, logo) sit in the project root and **will** be pushed; keep the repo private, or move them out first.
2. **Import the repository.** Go to <https://vercel.com> → **Add New…** → **Project** → import the repository. Vercel detects Next.js by itself, so **no `vercel.json` is needed**. Keep the default build settings.
3. **Add the environment variables.** Before clicking **Deploy**, open **Environment Variables** and add all five from section 2, step 6. For `NEXT_PUBLIC_SITE_URL`, use the address you will actually share: your own domain if you'll add one, otherwise the `https://<project>.vercel.app` address Vercel shows.
4. Click **Deploy**.
5. **Optional: add your own domain.** Go to **Project** → **Settings** → **Domains** and add it (e.g. `cards.example.com`). Then set `NEXT_PUBLIC_SITE_URL` to it, and **redeploy**: **Deployments** → ⋯ → **Redeploy**.

Every later `git push` to `main` redeploys automatically.

## 4. `NEXT_PUBLIC_SITE_URL` — getting the QR domain right

Every QR code contains `<NEXT_PUBLIC_SITE_URL>/verify/<id>`, and **that URL is saved with the card when it is issued**. Printed cards can't change afterwards, so:

- **Format:** the exact public address, starting with `https://` and with no trailing slash, e.g. `https://cards.example.com`.
- **Required in production:** if it isn't set, the app refuses to issue cards and shows "server settings are incomplete". This prevents QR codes from pointing at a temporary Vercel preview URL or at `localhost`.
- **Changing it needs a redeploy:** `NEXT_PUBLIC_` values are fixed when the app is built, so redeploy after changing it on Vercel.
- **Choose it once:** if you move to a new domain later, cards already printed keep the old address. Keep the old domain working (e.g. redirect it) or re-issue those cards.
- **Local development:** it may stay empty, in which case `http://localhost:3000` is used. To scan with a phone on your Wi-Fi, see section 6.

## 5. Testing the live deployment

1. Open `https://<your-domain>/`. You should be sent to **/login**, in English (the default), with the company logo and the title "Admin sign-in".
2. Log in with the admin user from section 2, step 5. The **new card form** opens, with a **Sign out** button in the header.
3. Fill in a test card. Use an obvious test serial such as `TEST00001` in cells 8–16, then click **Generate card**. A green "Card created and saved" message appears and the card preview opens.
4. Check the **verification link** box. It must start with your real domain, **not** `localhost` or a preview `…vercel.app` URL.
5. **Scan the QR code with your phone** (camera app or any QR scanner), preferably on mobile data rather than office Wi-Fi. It should open `https://<your-domain>/verify/<id>` with the green ✅ banner and this card's details, with no login.
6. On the phone, use the **English / عربي / اردو** switch. The page text changes language, and switches to right-to-left for Arabic and Urdu. The official card below stays exactly the same. Reload: your choice is remembered.
7. Change one letter of the id in the phone's address bar. You should see the red "This card could not be verified" warning.
8. Back on the computer, try **Download PDF**, **Print** and **Copy link** on the preview. Also check **Issued cards** (the card list) and its search.
9. Click **Sign out**, then open `/admin/cards`. You should be sent to the login page. The `/verify/…` link still works without login.

Test cards stay in the database. Delete them in Supabase → **Table Editor** → `upd_cards` if you don't want them.

## 6. Scanning QR codes from a phone during local development

A phone can't open `localhost`. Put your computer's LAN address in `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://192.168.100.12:3000
```

Then start the dev server on that address:

```bash
npm run dev -- -H 192.168.100.12
```

Connect the phone to the same Wi-Fi and create a new card. If Windows asks, allow Node.js through the firewall for private networks.

---

## Where things live

| What | Where |
|---|---|
| Company details (names, code E30, country, logo, **phone numbers**) | [`src/config/company.ts`](src/config/company.ts), the single source of truth |
| Logo | [`public/logo.png`](public/logo.png); `public/logo-card.png` is the smaller copy used on the card |
| Fixed bilingual card text (from the reference PDF) | [`src/config/card-template.ts`](src/config/card-template.ts) |
| UI translations | [`src/i18n/en.json`](src/i18n/en.json), [`src/i18n/ar.json`](src/i18n/ar.json), [`src/i18n/ur.json`](src/i18n/ur.json); language list and default in [`src/i18n/languages.ts`](src/i18n/languages.ts) |
| Language context + `t()` | [`src/i18n/LanguageProvider.tsx`](src/i18n/LanguageProvider.tsx) |
| Who counts as an admin | [`src/lib/admin-access.ts`](src/lib/admin-access.ts) |
| Auth checks (`getAdmin`, `requireAdminPage`) | [`src/lib/auth.ts`](src/lib/auth.ts), with [`src/proxy.ts`](src/proxy.ts) for session refresh and early redirects |
| Under-run number logic | [`src/lib/under-run-number.ts`](src/lib/under-run-number.ts) |
| Database schema | [`supabase/schema.sql`](supabase/schema.sql) |

## Languages: two separate concerns

- **The app interface** (nav, forms, buttons, messages, tab titles) is available in **English**, **Arabic** and **Urdu**. The **English / عربي / اردو** switch is on every page.
  - First-time visitors get **English**.
  - The choice is saved in `localStorage` and mirrored into a cookie (`upd-ui-language`). The server reads the cookie, so every page loads already in the right language and direction, with no flash of the wrong layout.
  - **Direction follows the language:** English is left-to-right, Arabic and Urdu right-to-left (`<html lang dir>`). Layout uses logical spacing, so it mirrors automatically; typed values such as VINs and card numbers always read left-to-right.
  - **Fonts:** English uses **Noto Sans**, Arabic **Noto Sans Arabic**, and Urdu **Noto Nastaliq Urdu**, the calligraphic style Urdu readers expect. Typed data never uses Nastaliq.
  - **Adding a string:** add the same key to **all three** of `en.json`, `ar.json` and `ur.json`. TypeScript reports an error if any file is missing a key.
  - **Changing the default:** set `DEFAULT_LANGUAGE` in [`src/i18n/languages.ts`](src/i18n/languages.ts).
- **The official card** always uses the fixed Arabic + English format from the reference PDF, in every UI language. It never uses `t()`, and its text comes only from `src/config/card-template.ts`. Downloaded PDFs are pixel-identical whichever UI language is active.

## The official card (PDF replica)

[`src/components/card/UpdCard.tsx`](src/components/card/UpdCard.tsx) and its [CSS module](src/components/card/UpdCard.module.css) recreate `CargoBarriersCard (286).pdf`:

- **Page and geometry:** US Letter landscape, 792 × 612 pt. Positions, sizes and colors were read from the reference PDF's own coordinates.
- **Fonts:** Noto Sans for Latin text and Noto Sans Arabic for Arabic, the same fonts the reference uses.
- **Accuracy:** printed output was measured against the reference. The median text-baseline error is about 0.2 pt for Latin and 0.6 pt for Arabic (1 pt ≈ 0.35 mm).
- **Same in every UI language:** verified pixel for pixel.
- **Merged cells 8 and 9:** the reference draws them as one box, and the replica copies that. To separate them, remove the `joined`/`joinedLeft` classes.

Ways to get the card out:

- **Print:** vector output on exactly one landscape Letter page (`@page upd-card`).
- **Download PDF:** runs entirely in the browser. The browser draws the card itself, so Arabic letters join correctly. It embeds only the fonts the card uses, at about 290 dpi.
- **QR code:** generated from the saved `qr_url`. The same URL always gives the same code, so the image isn't stored.

## Distinguished Under-Run Number (16 cells)

| Cells | Content | Source |
|---|---|---|
| 1–3 | `K` `S` `A` | constant (`COMPANY.country_code`) |
| 4–6 | `E` `3` `0` | the manufacturer code (from company config, editable per card) |
| 7 | UPD type, e.g. `S/R/F` | the card's `upd_type` |
| 8–16 | 9-character serial | typed per card; letters A–Z and digits only |

`buildUnderRunNumber("KSAE30", "S/R/F", "RRR262066")` returns the full string `KSAE30S/R/FRRR262066` and a 16-entry `cells` array. The database enforces a UNIQUE constraint on the full string.

## Pages and API

| Route | Access | What |
|---|---|---|
| `/login` | public | Admin login |
| `/` | admin | New-card form |
| `/cards/[id]/preview` | admin | The card, with Copy link, Download PDF, Print and Create another |
| `/admin/cards` | admin | All cards. Search by chassis number, brand, model or number; each row has View, Copy link and Download PDF |
| `/verify/[id]` | **public** | Opened by the QR code. Read-only |
| `POST /api/cards` | admin | Issues a card: `201 { card, qr_svg }`, or `{ error, field? }` |
| `GET /api/cards/[id]` | public | A card's public fields. Rate-limited and cacheable |
| `POST /api/auth/login` / `logout` | public | Start or end an admin session (login is rate-limited) |

What `/verify/[id]` can show:

- **Genuine card:** a green ✅ banner, the card's details, the official card, a Copy-link button and the issuer's contact details.
- **Unknown id:** a red "this card could not be verified" warning.
- **Database error:** a neutral "try again" message. It is deliberately **not** shown as a fake card, so an outage can never make a genuine card look forged.

Both the genuine and unknown verdicts are fully rendered on the server, so they appear immediately, even without JavaScript. The unknown-id page returns HTTP 200 with `noindex`, not 404: in this Next.js version a segment-level `notFound()` only rendered in the browser.

## Security

- **Admin access** requires a Supabase session, **plus** an email listed in `ADMIN_EMAILS`, **plus** a confirmed email. Every admin page and `POST /api/cards` checks this on the server; the proxy only refreshes the session and redirects early.
- **Login throttling:** 20 attempts per 15 minutes per IP, and 10 *failed* attempts per account. After that the account is locked for up to 15 minutes, whoever sent the attempts. Supabase applies its own limits too.
- **Cross-site requests:** the state-changing endpoints reject requests from other sites, on top of the `SameSite=Lax` session cookies. The `?next=` redirect after login only accepts paths on this site.
- **Database:** row-level security with no policies means the public key can't read or write cards. Only the server's secret key can.
- **Public data:** the public page and API never expose `created_by` (the issuing admin's email).
- **Card ids:** 12 random characters, about 71 bits, so they can't practically be guessed.
- **Public API:** limited to 60 requests per minute per IP, with short caching.
- **Framing:** `X-Frame-Options: DENY` and `frame-ancestors 'none'` stop other sites from wrapping the genuine page inside a look-alike.

Known limits:

- The rate limiter and cache live in each server instance's memory. On Vercel each instance counts separately. For stronger protection, use a shared store (e.g. Upstash Redis) or Vercel's firewall rules.
- If cards can ever be revoked, clear the cache entry on revoke and shorten the `Cache-Control` times.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login says "this account isn't allowed into the admin panel" | Add the email to `ADMIN_EMAILS` (on Vercel: then redeploy). |
| Login says "this email hasn't been confirmed" | In Supabase → Users, confirm the user, or re-create them with **Auto Confirm User** ticked. |
| Issuing a card says "server settings are incomplete" | Set `NEXT_PUBLIC_SITE_URL` and redeploy. |
| The QR code opens `localhost` or an old domain | Fix `NEXT_PUBLIC_SITE_URL` and redeploy, then issue a new card. Existing cards keep the URL they were issued with. |
| Everything fails after a quiet week | The free Supabase project paused. Restore it in the dashboard. |
