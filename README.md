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

   Open [http://localhost:3000](http://localhost:3000) — the root path redirects to `/login` (placeholder until auth is implemented).

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
4. Deploy. Update Supabase Auth **redirect URLs** when the production URL is known (magic link callback — completed in task 2.0).

Do not commit `.env.local` or real secrets; only `.env.example` is tracked.

## Product docs

- PRD: [`internal docs/prd-custom-customer-portal.md`](internal%20docs/prd-custom-customer-portal.md)
- Task list: [`internal docs/tasks-prd-custom-customer-portal.md`](internal%20docs/tasks-prd-custom-customer-portal.md)
