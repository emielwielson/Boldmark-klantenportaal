# Product Requirements Document: Custom Customer Portal (Single Customer)

## 1. Introduction/Overview

This document defines the requirements for building a **custom customer portal** on top of Notion. The portal surfaces **one Tasks database**. Access is driven entirely by **email**: each task row has a **People** property **`KlantV2`** in which the operator links **guests** (and other people). Each linked person has an email; the portal resolves the signed-in user to that same identity and shows only tasks where they appear in **`KlantV2`**.

### Problem Statement

The operator needs a web application that exposes that single Notion tasks database to external parties without giving them full Notion workspace access. Access must be granular: each user sees only tasks where they are linked via **`KlantV2`**, matched by email to the authenticated user.

### Goal

Build a **single Vercel project** (one deployment, not reused as a multi-customer product) that lets guests log in with email (magic link), see the tasks they are on, and edit task fields—with isolation enforced by **`KlantV2`** membership, not a separate contacts database.

---

## 2. Goals

1. **Single deployment** — One codebase and one Vercel project for this operator; no multi-tenant product features
2. **Email-based access control** — The signed-in email must correspond to a **person** assigned on a task via the **`KlantV2`** People property
3. **Strict data isolation** — Users see only tasks where they appear in **`KlantV2`** (and cannot access other tasks)
4. **Reuse proven architecture** — Leverage the Notion Portals stack (Next.js, Supabase, Notion) for consistency and maintainability
5. **Performance** — Use Supabase as a cache layer to avoid slow, direct Notion API calls for reads

---

## 3. User Stories

### As a guest (end user linked via `KlantV2`)

- **US-1:** As a guest, I want to log in with my email (magic link), so that I can access the portal without managing passwords.
- **US-2:** As a guest, I want to see only tasks where I am linked in **`KlantV2`**, so that I cannot view other clients’ tasks.
- **US-3:** As a guest, I want to edit task fields in the portal, so that I can keep information up to date without using Notion directly.

### As a portal operator (workspace admin in Notion)

- **US-4:** As an operator, I want to control portal access by adding or removing people on **`KlantV2`** for each task in Notion, so that I do not need a separate admin app.
- **US-5:** As an operator, I want changes made in Notion to show up when guests log in or refresh, so that I can keep working in Notion as usual.

---

## 4. Functional Requirements

### 4.1 Authentication

**FR-1:** The system must allow users to authenticate via Supabase Auth using email and magic link.

**FR-2:** The system must associate each authenticated user with a **Notion person identity** (workspace user / guest) that matches their email, for comparison against **`KlantV2`**.

**FR-3:** The system must reject login or restrict access if the user's email does not correspond to any person who can appear in **`KlantV2`** on tasks (i.e. they would have zero in-scope tasks).

### 4.2 Access Model (Email + `KlantV2`)

**FR-4:** The system must integrate with **one Notion database** — the **Tasks** database. Access is not driven by a separate contacts database. The Tasks database has a **People** property **`KlantV2`**; the operator links one or more people (guests) per task. Each person has an email used for portal login and authorization.

### 4.3 Row-Level Access

**FR-5:** The system must show a user only **task** rows where their resolved person appears in **`KlantV2`**. A task may link **multiple** people on **`KlantV2`**; the user sees the task if they are **any** of those people.

**FR-6:** The system must enforce row-level access at both the application layer and, where possible, at the database layer (e.g., RLS in Supabase) so users cannot read or mutate tasks they are not authorized to see.

### 4.4 Notion Integration

**FR-7:** The system must use one Notion integration with access to the configured Tasks database.

**FR-8:** The system must read and write **Task** pages in Notion (all properties exposed in the portal are task-level).

**FR-9:** The system must filter and sync tasks using **`KlantV2`** person identifiers (and email resolution) so cache and API responses stay scoped per user.

**FR-10:** The system must support **editing all task properties** that the portal surfaces (no separate read-only allowlist for MVP).

**FR-11:** The system must normalize Notion properties into app models and route all Notion API calls through server actions or API routes (no client-side Notion access).

**FR-12:** The system must use **last-write-wins** when the portal and Notion both change the same page: the latest successful write to Notion prevails; no merge or locking protocol is required for MVP.

### 4.5 Data Sync & Caching

**FR-13:** The system must use Supabase as a cache for Notion data to improve read performance.

**FR-14:** The system must sync **Tasks** data from Notion on **login** and on **page refresh**.

**FR-15:** The system must store `last_synced_at` for cached records and support staleness checks.

**FR-16:** The system must update Supabase immediately on user edits and propagate changes to Notion asynchronously.

### 4.6 Security

**FR-17:** The system must enforce Row Level Security (RLS) in Supabase so that users can only read and write cached task data associated with tasks where their resolved person is in **`KlantV2`**.

**FR-18:** The system must validate email→person mapping and task row access on every request before returning or mutating data.

**FR-19:** The system must prevent access to tasks (by ID or cache key) that are not in the user’s scope—even if identifiers look valid.

**FR-20:** The system must store Notion API tokens securely (e.g., environment variables or Supabase secrets).

### 4.7 User Experience

**FR-21:** The system must provide a login page for email-based magic link authentication.

**FR-22:** The system must provide a dashboard showing tasks the user is authorized to see.

**FR-23:** The system must display loading indicators during sync and data fetch operations.

**FR-24:** The system must display clear error messages when the user has no in-scope tasks, when Notion is unavailable, or when access is denied.

### 4.8 Error Handling & Edge Cases

**FR-25:** The system must handle users whose email does not match any person on **`KlantV2`** for any task (e.g., show "No access" or "Contact administrator").

**FR-26:** The system must handle Notion API downtime or rate limits gracefully, using cached data when available.

**FR-27:** The system must handle schema changes in Notion (e.g., renamed properties) without breaking the portal, with appropriate logging or admin alerts.

**FR-28:** The system must handle removal of the user from **`KlantV2`** or deletion of a task (user loses access to that task on next sync).

---

## 5. Non-Goals (Out of Scope)

1. **Reusable multi-customer product** — This repo is **one** Vercel deployment for **one** operator; no multi-tenant routing, org switcher, or env templates for unrelated customers
2. **Admin UI** — Access and assignments live in Notion (**`KlantV2`**); no separate admin panel
3. **OAuth / social login** — Initial version uses email + magic link only
4. **Real-time collaborative editing** — Notion remains source of truth; the portal uses sync + **last-write-wins** (see FR-12)
5. **Heavy custom branding** — UI should feel **as Notion-like as possible**; a logo may be added later without a full design system
6. **Audit logs and activity feeds** — Future consideration
7. **AI-powered features** — Out of scope
8. **Cron-based sync** — Sync is triggered on login and page refresh; no scheduled cron jobs for the main data flow

---

## 6. Design Considerations

### 6.1 Data Model (Notion)

**Notion structure:**

- **Tasks (single database)** — Each row is a task. The **People** property **`KlantV2`** lists one or more people (guests). There is **no** separate Contacten or contacts database; identity and email come from those people as Notion represents them.

**Access logic:**

- User logs in with `user@example.com`.
- The portal resolves that email to a **person** identity used in Notion.
- The user sees every **task** where that person appears in **`KlantV2`**. Multiple people on one task are supported; co-assignees each see the same task if they are all on **`KlantV2`**.

### 6.2 UI/UX

- **Visual language:** As **Notion-like** as practical (typography, spacing, neutral surfaces). Logo can be added later.
- **Login:** Simple email input + "Send magic link" button.
- **Dashboard:** Table or card view of tasks in scope; **all surfaced properties are editable** (aligned with FR-10).
- **No org selector:** One deployment, one operator context.

### 6.3 Responsive Design

- The application should work on desktop and mobile.
- Loading and error states should be clear and consistent.

---

## 7. Technical Considerations

### 7.1 Architecture

```
Browser (Next.js – Vercel)
   ↓
Server Actions / API Routes
   ↓
Supabase
   ├─ Auth (magic-link users)
   ├─ Person resolution (email → Notion person / user id used in KlantV2)
   ├─ Cached Tasks rows (RLS scoped: user may only see tasks they are on)
   └─ Configuration (Tasks database ID, property names including KlantV2, integration token)
   ↓
Notion API
```

All Notion reads and writes go through the server; the browser never holds the integration token.

### 7.2 Relationship to Notion Portals (reference codebase)

Implementation may borrow patterns from **Notion Portals** (Next.js, Supabase cache, sync on login/refresh, RLS). This product is **not** multi-tenant: there is no org membership table or per-customer reuse of one deployment—access is **email → person → tasks where that person is in `KlantV2`**.

### 7.3 Technology Stack

**Frontend:** Next.js (App Router), Tailwind CSS, Server Actions (or equivalent server-only handlers)  
**Backend:** Supabase (Postgres, Auth, RLS)  
**External:** Notion API  
**Deployment:** **Single Vercel project** for this operator  
**Sync:** On login and page refresh (see §5: no cron for primary sync)

### 7.4 Database Schema (Supabase) — Proposed

Names are indicative; align table and column names with the implementation repo.

- **`portal_config`** — Single deployment: Notion **Tasks** database ID, property name for **`KlantV2`**, and any mapping flags (e.g. how to resolve person email via Notion API).
- **`user_person_scope`** (or equivalent) — After auth: `user_id` → Notion **person/user id(s)** that match the login email, used to filter cached tasks and to enforce RLS.
- **`notion_sync_cache`** — Cached task rows with **`KlantV2`** person IDs (multi-value) and task page id; RLS allows a row only if the authenticated user’s resolved person id is contained in that task’s **`KlantV2`** set.
- **Editing** — All surfaced columns writable (FR-10); no separate permissions table unless implementation detail requires it.

RLS policies should key off `auth.uid()` and membership in **`KlantV2`** for each cached task, consistent with **FR-17**.

### 7.5 Folder Structure (Aligned with Notion Portals)

```
app/
  login/
  dashboard/
  api/
    auth/
    notion/

lib/
  notion/
  supabase/
  sync/
  permissions/
  person-resolver/   # Email ↔ Notion person ids for KlantV2 matching

types/
```

Omit `api/cron/` unless a future feature adds scheduled jobs; background work for Notion writes can use server-side queues or fire-and-forget patterns without a cron route.

### 7.6 Security

- **RLS:** Cached task rows must only be visible when the authenticated user’s resolved **person** id is among the **`KlantV2`** values for that task.
- **Server-side checks:** Every read and mutation validates task scope (defense in depth with RLS).
- **Secrets:** Notion integration token and Supabase secret key (if any) live in environment or managed secrets; never ship to the client.

---

## 8. Decisions & Assumptions

1. **No Contacten database** — Only the **Tasks** database exists for portal data. **`KlantV2`** is a **People** property; guests (and others) are linked there. Emails come from those people as Notion exposes them.

2. **`KlantV2` cardinality** — A task may link **more than one** person. A user sees the task if their resolved person is **any** of the people on **`KlantV2`**.

3. **Editing** — **All** task properties shown in the portal are **editable** (FR-10).

4. **Branding** — UI should be **as Notion-like as possible**; a **logo** may be added later.

5. **Deployment** — **One Vercel project** for this operator. This codebase is **not** intended as a reusable multi-customer template (see §5).

6. **Conflicts** — **Last-write-wins** between portal and Notion (FR-12); no merge/lock protocol for MVP.

---

## 9. Success Metrics

1. **Access correctness** — Row visibility and mutations match the email → person → **`KlantV2`** policy; no cross-task exposure for users not on a task, and no incorrect denial for valid assignees.
2. **Performance** — Dashboard usable within about 2 seconds when serving from Supabase cache under normal conditions.
3. **Sync reliability** — Login and refresh sync succeed in the high nineties percentile; failures surface clear errors and do not silently show stale data as current without indication.
4. **User experience** — Guests complete magic-link login and see their tasks without using Notion directly.
5. **Maintainability** — Reuse Notion Portals-style patterns where helpful (sync, Notion client, RLS) without inheriting multi-tenant product assumptions.

---

## 10. Future Considerations

1. **Notion webhooks** — Push or event-driven invalidation of cache when pages change, reducing reliance on refresh-only sync.
2. **Lightweight operator tools** — Optional read-only dashboard for sync status or health (still not a full replacement for Notion as source of truth for access).
3. **OAuth** — Optional Google or Microsoft sign-in alongside magic link, with the same email → person / **`KlantV2`** resolution.
4. **Audit trail** — Log of portal logins and edits for compliance or support.
5. **Stronger branding** — Design system, custom domain, and white-label polish beyond MVP styling.
6. **Additional databases** — If the operator later adds more Notion databases, define how they map to the same **email + `KlantV2`** model and RLS.

---

## Appendix: Reference — Notion Portals Architecture

The **Notion Portals** codebase is the reference implementation for:

- Next.js App Router with Supabase Auth
- Supabase as a performance cache for Notion-backed reads
- RLS to enforce data scope at the database layer
- Sync triggered on login and page refresh
- Centralized Notion client, sync helpers, and permission checks under `lib/`

**Custom Customer Portal** reuses that stack where useful but replaces organization-scoped membership with **email → Notion person → Tasks where that person appears in `KlantV2`**. It targets **one Vercel deployment** (not a reusable multi-customer product). Editing is **all surfaced fields** (§4, §6), with **last-write-wins** (FR-12), not role-based column matrices from multi-org products.
