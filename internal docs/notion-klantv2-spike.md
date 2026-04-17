# Notion spike: KlantV2 People + email resolution (task 4.2)

This note captures what we rely on from the Notion API for the customer portal. Authoritative references: [Retrieve a user](https://developers.notion.com/reference/get-user), [Query a data source](https://developers.notion.com/reference/query-a-data-source).

## KlantV2 on task pages

- The Tasks database has a **People** property (name from `NOTION_KLANTV2_PROPERTY`, default `KlantV2`).
- On each **page** (`PageObjectResponse`), that property appears as:

  `{ "type": "people", "people": [ … ] }`

- Entries are usually **user** objects (`object: "user"`) with a stable **`id`** (UUID string). Notion may also return **group** objects (`object: "group"`) in the same array; portal RLS matches **workspace user** ids in `user_person_scope`, so groups are ignored for scope.

## Email ↔ Notion person id

- Supabase Auth gives `auth.users.email`. Notion exposes emails on **person** users via `person.email` on `UserObjectResponse` when the integration can read users (`users.read` capability).
- **Primary strategy:** paginate `users.list`, keep users with `type === "person"` where `person.email` matches the auth email (case-insensitive).
- **Guest strategy (when the list yields no match):** paginate the Tasks data source **without** a people filter, collect every Notion **user** id on `KlantV2` across all pages, then call `users.retrieve` for each distinct id and match `person.email` to the auth email (`lib/person-resolver/guest-person-ids-from-tasks.ts`). This is heavier than the list path; use it so guests who do not appear in `users.list` can still log in when they appear on at least one task.

## Querying tasks (API v5+)

- The SDK uses **`dataSources.query`** with `data_source_id`. We resolve it via `lib/notion/get-primary-data-source.ts`: either `NOTION_TASKS_DATABASE_ID` is a **database** id (then we use the first `data_sources` entry) or it is already a **data source** id (validated with `dataSources.retrieve`).
- Filters use `property` + `type: "people"` + `people: { contains: "<notion-user-uuid>" }`, combined with top-level `{ or: [ … ] }` for multiple assignees.
