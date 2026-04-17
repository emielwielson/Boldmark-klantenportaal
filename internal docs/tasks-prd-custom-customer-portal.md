# Task list: Custom Customer Portal

Derived from `prd-custom-customer-portal.md`.

## Relevant Files

- `package.json` — Dependencies: Next.js (App Router), React, Tailwind, Supabase client/server, Notion SDK.
- `.env.local` / Vercel env — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server only), `NOTION_TOKEN`, Tasks database ID, property names (e.g. `KlantV2`). Never commit secrets.
- `middleware.ts` — Optional: Supabase session refresh for protected routes.
- `app/layout.tsx` — Root layout, fonts, global Notion-like styles.
- `app/login/page.tsx` — Email + magic link UI (FR-21).
- `app/auth/callback/route.ts` — Supabase Auth callback handler if used.
- `app/dashboard/page.tsx` — Task list / dashboard shell (FR-22).
- `app/dashboard/loading.tsx` — Loading UI for dashboard segment.
- `app/api/...` or `app/**/actions.ts` — Server Actions / route handlers only path to Notion (FR-11).
- `lib/supabase/client.ts` — Browser Supabase client for auth.
- `lib/supabase/server.ts` — Server client with cookies for RLS-aware reads where applicable.
- `lib/supabase/admin.ts` — Server client using `SUPABASE_SECRET_KEY` for sync jobs only if RLS blocks server sync (use sparingly, validate scope in code).
- `lib/notion/client.ts` — Single Notion client instance; no token export to client.
- `lib/notion/tasks.ts` — Query/update task pages; map properties to app types (FR-8, FR-11).
- `lib/sync/tasks-sync.ts` — Pull tasks from Notion, filter by resolved person in `KlantV2`, upsert cache (FR-9, FR-13–FR-16).
- `app/dashboard/actions.ts` — Server Actions for cache + Notion updates (`updateTaskProperty`, task 5).
- `lib/person-resolver/index.ts` — Resolve `auth email` → Notion user/person IDs used in `KlantV2` (FR-2, FR-9).
- `lib/permissions/task-scope.ts` — Server-side check: task ID in user scope (FR-18, FR-19).
- `types/notion-task.ts` — TypeScript models for cached task rows and API payloads.
- `supabase/migrations/*.sql` — `portal_config`, `user_person_scope`, `notion_sync_cache` (or equivalent), RLS policies (FR-17).
- `components/tasks/TaskList.tsx` — Renders authorized tasks (Notion-like table/cards).
- `components/tasks/TaskRowEditor.tsx` — Editable fields for one task; submit via Server Action.
- `components/ui/Spinner.tsx`, `components/ui/ErrorBanner.tsx` — Loading and errors (FR-23, FR-24).
- `__tests__/` or `*.test.ts` — Unit tests for person-resolver, scope checks, property mapping (where pure logic allows).

### Notes

- Unit tests should typically live next to the code (`person-resolver.test.ts` beside `person-resolver/index.ts`) or under `__tests__` per project convention once Jest/Vitest is configured.
- Use `npx jest [path]` or `npx vitest [path]` once the test runner is added; running without a path executes the full suite.
- Notion **People** / guest resolution is API-dependent: implementation must confirm how `KlantV2` values appear (user IDs) and how email is matched—sub-tasks below call this out explicitly.
- All Notion mutations go server-side; validate task scope on every mutation (FR-18, FR-19).

## Tasks

- [ ] 1.0 Bootstrap Next.js app, dependencies, and deployment wiring
  - [ ] 1.1 Create Next.js (App Router) project with TypeScript and Tailwind; add base `layout` and a placeholder home redirect to `/login` or `/dashboard`.
  - [ ] 1.2 Add Supabase JS clients (`@supabase/supabase-js`) and `@notionhq/client`; document required env vars in `.env.example` (no real secrets).
  - [ ] 1.3 Configure Vercel project (single deployment) and connect repo; set env vars for Preview/Production.
  - [ ] 1.4 Add ESLint/Prettier (or project defaults) and a minimal README: how to run locally and deploy.

- [ ] 2.0 Supabase Auth: magic link login and session handling
  - [ ] 2.1 Enable Email provider with magic link in Supabase dashboard; configure redirect URLs for local and production.
  - [ ] 2.2 Implement `app/login/page.tsx`: email input, “Send magic link”, success/error toasts or inline messages (FR-21).
  - [ ] 2.3 Wire Supabase client session (cookies / middleware) so authenticated users can reach `/dashboard` and unauthenticated users are sent to `/login`.
  - [ ] 2.4 Handle sign-out and session expiry with clear UX (redirect to login).

- [x] 3.0 Supabase database: cache schema, `user_person_scope`, and RLS
  - [x] 3.1 Design migrations for `portal_config` (Tasks DB id, `KlantV2` property name, optional flags).
  - [x] 3.2 Design `user_person_scope` (or equivalent): link `auth.users` / `user_id` to Notion person IDs that match the login email after resolution (§7.4).
  - [x] 3.3 Design `notion_sync_cache` (or split tables): store task page id, serialized properties, `klant_v2_person_ids[]`, `last_synced_at` (FR-15).
  - [x] 3.4 Write RLS policies: users read/write only cache rows where their resolved person ID is contained in the task’s `KlantV2` set (FR-17); add policies for `user_person_scope` as needed.
  - [x] 3.5 Document whether sync upserts use secret key + manual scope checks vs user-scoped inserts—either is valid if scope is enforced in code and RLS matches (FR-6).

- [x] 4.0 Person resolution and Notion API integration (server-only)
  - [x] 4.1 Implement `lib/notion/client.ts` with token from env only; never import into client components (FR-20).
  - [x] 4.2 Spike: given Tasks database pages, read `KlantV2` people values and determine how to obtain stable IDs and match to Supabase Auth email (workspace users vs guests—follow Notion API capabilities) (FR-2, FR-4).
  - [x] 4.3 Implement `person-resolver`: after login, resolve email → one or more Notion person/user IDs; persist to `user_person_scope` for RLS and filtering (FR-2, FR-9).
  - [x] 4.4 Implement query that lists task pages from the Tasks database and filters to rows where any `KlantV2` ID matches the resolved person set (FR-5, FR-9); handle multiple people per task (FR-5, §8).
  - [x] 4.5 Map Notion properties to a normalized `Task` type for UI and cache (FR-11); keep mapping in one module for FR-27 (rename detection/logging later).

- [x] 5.0 Sync pipeline: login + refresh, cache updates, writes to Notion
  - [x] 5.1 On successful auth and on dashboard load/refresh, run sync: fetch in-scope tasks from Notion, upsert into `notion_sync_cache`, update `last_synced_at` (FR-13, FR-14).
  - [x] 5.2 On user edit from UI: optimistic or immediate update to Supabase cache, then async update to Notion page properties; document **last-write-wins** behavior (FR-12, FR-16).
  - [x] 5.3 Ensure every read/update by task ID checks scope in server code even if RLS also applies (FR-18, FR-19).
  - [x] 5.4 Handle FR-25: no matching person on any task—show “No access” / contact administrator; avoid empty dashboard with no explanation.
  - [x] 5.5 Handle FR-26: Notion rate limits / downtime—surface errors, allow stale cache reads with clear “last updated” messaging where safe.
  - [x] 5.6 Handle FR-28: user removed from `KlantV2` or task deleted—row disappears on next sync; no orphaned client-only state.

- [ ] 6.0 Dashboard UI, Notion-like styling, and responsive behavior
  - [ ] 6.1 Build dashboard: table or card list of in-scope tasks from Supabase (RLS-scoped reads) with loading skeletons (FR-22, FR-23).
  - [ ] 6.2 Implement editing for **all** surfaced task properties (FR-10): forms or inline cells bound to Server Actions; validate types against Notion property types.
  - [ ] 6.3 Apply Notion-like visual language: neutral background, readable type scale, subtle borders—leave hook for logo later (§6.2, §8).
  - [ ] 6.4 Responsive layout for mobile and desktop (§6.3); touch-friendly controls.
  - [ ] 6.5 Centralized error UI for denied access, Notion errors, and network failures (FR-24).

- [ ] 7.0 Quality, observability, and handover
  - [ ] 7.1 Add structured logging for sync failures and property mapping mismatches (FR-27).
  - [ ] 7.2 Add unit tests for pure helpers: person ID matching, scope check helpers, property normalization (where deterministic).
  - [ ] 7.3 Manual test checklist aligned with §9 success metrics: isolation between two test accounts, edit round-trip, refresh after Notion-side change.
  - [ ] 7.4 Production readiness: secure headers, no leaked env in client bundle, Notion integration scoped to Tasks DB only (FR-7).
