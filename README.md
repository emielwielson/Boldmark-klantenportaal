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
   - **Site URL:** `http://localhost:3000` for local development. After deploying, set this to your production URL (e.g. `https://your-app.vercel.app`).
   - **Redirect URLs:** Add at least:
     - `http://localhost:3000/**`
     - `http://localhost:3000/auth/callback`
     - `https://<your-production-host>/**`
     - `https://<your-production-host>/auth/callback`

   Magic links use `emailRedirectTo` pointing at `/auth/callback` on the same origin as the app.

3. After the first **Vercel** deployment, copy the production URL into **Site URL** and **Redirect URLs** so production magic links work.

## Scripts

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start Next.js in development mode       |
| `npm run build`        | Production build                        |
| `npm run start`        | Start production server (after `build`) |
| `npm run lint`         | Run ESLint                              |
| `npm run format`       | Format with Prettier                    |
| `npm run format:check` | Check formatting                        |

## Deploy on Vercel

1. Import the GitHub repository [emielwielson/Boldmark-klantenportaal](https://github.com/emielwielson/Boldmark-klantenportaal) in the [Vercel dashboard](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Add the same variables as in `.env.example` under **Settings → Environment Variables** for **Production** and **Preview** (use test keys for Preview if desired).
4. Deploy. Add your production URL and `https://<host>/auth/callback` to Supabase **Redirect URLs** and set **Site URL** (see [Supabase Auth](#supabase-auth-dashboard-configuration) above).

Do not commit `.env.local` or real secrets; only `.env.example` is tracked.

## Product docs

- PRD: [`internal docs/prd-custom-customer-portal.md`](internal%20docs/prd-custom-customer-portal.md)
- Task list: [`internal docs/tasks-prd-custom-customer-portal.md`](internal%20docs/tasks-prd-custom-customer-portal.md)
