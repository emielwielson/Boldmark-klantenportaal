# Boldmark Klantenportaal

Next.js customer portal for Notion-backed tasks (see [`internal docs/prd-custom-customer-portal.md`](internal%20docs/prd-custom-customer-portal.md)).

## Prerequisites

- **Node.js** 20.x or newer (LTS recommended)
- **npm** (lockfile: `package-lock.json`)

## Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables and fill in real values from Supabase and Notion:

   ```bash
   cp .env.example .env.local
   ```

   | Variable                               | Notes                                                                                      |
   | -------------------------------------- | ------------------------------------------------------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                                                       |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`, browser-safe)                                       |
   | `SUPABASE_SECRET_KEY`                  | **Server only** — secret key (`sb_secret_...`); never expose or prefix with `NEXT_PUBLIC_` |
   | `NOTION_TOKEN`                         | Notion internal integration secret                                                         |
   | `NOTION_TASKS_DATABASE_ID`             | ID of the single Tasks database                                                            |
   | `NOTION_KLANTV2_PROPERTY`              | People property name (default: `KlantV2`)                                                  |

   **Notion API (task 4):** KlantV2 People shapes on pages and email → Notion user matching are documented in [`internal docs/notion-klantv2-spike.md`](internal%20docs/notion-klantv2-spike.md).

3. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — the root path redirects to `/login`. After configuring Supabase Auth (below), you can request a magic link and land on `/dashboard`.

## Supabase Auth (dashboard configuration)

Configure these in the [Supabase Dashboard](https://supabase.com/dashboard) for your project (task 2.0 — magic link).

1. **Authentication → Providers → Email**  
   Enable **Email**. Enable **magic link** / “Sign in with email” (OTP to inbox) as needed.

2. **Authentication → URL configuration**
   - **Site URL:** `http://localhost:3000` for local development on your machine. After deploying, set this to your production URL (e.g. `https://your-app.vercel.app`).
   - **Redirect URLs:** For normal day-to-day dev, **localhost in Supabase is enough**: e.g. `http://localhost:3000/**` and `http://localhost:3000/auth/callback` (or the wildcard pattern you already use). The magic link uses whatever origin your browser had when you requested the link (`emailRedirectTo` → `/auth/callback` on that host).
   - **Production:** add your deployed host (`https://…/**` and `/auth/callback`) when you go live.
   - **Only if** you open the app from another host (e.g. `http://192.168.x.x:3000` on your phone): add **that** origin and `/auth/callback` in Supabase too, and add the host to `allowedDevOrigins` in [`next.config.ts`](next.config.ts) if Next.js warns about blocked `/_next/webpack-hmr`. Use `npm run dev:lan` if you need the dev server reachable on the LAN.

3. After the first **Vercel** deployment, copy the production URL into **Site URL** and **Redirect URLs** so production magic links work.

### Troubleshooting

- **“This site can’t be reached” / “This page isn’t working” after `npm run dev`:**
  - Confirm the URL is **`http://`** not `https://` for local dev.
  - Stop anything else on port **3000**, or run `npx next dev -p 3001` and use that port everywhere (including Supabase redirect URLs).
  - Delete the `.next` folder and run `npm run dev` again.
  - Try a private/incognito window (stale cookies or a redirect loop).

## Database (Supabase — task 3.0)

SQL migrations live in [`supabase/migrations/`](supabase/migrations/). The first migration defines:

| Table               | Purpose                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `portal_config`     | Single row (`id = 1`): optional DB mirror of Tasks DB id + `KlantV2` property name.       |
| `user_person_scope` | Maps `auth.users` → Notion person id(s) for RLS (filled after person resolution, task 4). |
| `notion_sync_cache` | Cached Notion task rows: `properties` (jsonb), `klant_v2_person_ids`, `last_synced_at`.   |

**Apply migrations**

1. **Dashboard (simplest):** Supabase project → **SQL Editor** → paste the contents of [`supabase/migrations/20250417120000_cache_and_rls.sql`](supabase/migrations/20250417120000_cache_and_rls.sql) → **Run** (use a dev project first).
2. **Supabase CLI:** `supabase link` then `supabase db push` (requires [CLI install](https://supabase.com/docs/guides/cli) and linked project).

**Sync and RLS (task 3.5)**

- Requests using the **publishable key** and the user’s **JWT** (`createClient` from [`lib/supabase/server.ts`](lib/supabase/server.ts) in a logged-in context) are subject to **RLS**: users only see cache rows where one of their `user_person_scope.notion_person_id` values appears in `notion_sync_cache.klant_v2_person_ids`.
- The **secret key** (`SUPABASE_SECRET_KEY`) **bypasses RLS**. Server-side sync (Notion → Postgres) will typically use it; the app **must** still filter by user scope before returning or mutating data (defense in depth with RLS on user-facing paths — FR-6, FR-17).

## Scripts

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start Next.js in development mode                  |
| `npm run dev:lan`      | Same, listening on `0.0.0.0` (LAN / phone testing) |
| `npm run build`        | Production build                                   |
| `npm run start`        | Start production server (after `build`)            |
| `npm run lint`         | Run ESLint                                         |
| `npm run format`       | Format with Prettier                               |
| `npm run format:check` | Check formatting                                   |

## Deploy on Vercel

1. Import the GitHub repository [emielwielson/Boldmark-klantenportaal](https://github.com/emielwielson/Boldmark-klantenportaal) in the [Vercel dashboard](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Add the same variables as in `.env.example` under **Settings → Environment Variables** for **Production** and **Preview** (use test keys for Preview if desired).
4. Deploy. Add your production URL and `https://<host>/auth/callback` to Supabase **Redirect URLs** and set **Site URL** (see [Supabase Auth](#supabase-auth-dashboard-configuration) above).

Do not commit `.env.local` or real secrets; only `.env.example` is tracked.

## Product docs

- PRD: [`internal docs/prd-custom-customer-portal.md`](internal%20docs/prd-custom-customer-portal.md)
- Task list: [`internal docs/tasks-prd-custom-customer-portal.md`](internal%20docs/tasks-prd-custom-customer-portal.md)
