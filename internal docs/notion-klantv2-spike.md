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
- **Limitation:** Guests or users not returned by `users.list` will not resolve; extending with `users.retrieve` per candidate id or harvesting ids from pages is possible but not implemented here.

## Querying tasks (API v5+)

- The SDK uses **`dataSources.query`** with `data_source_id`. We obtain that id from `databases.retrieve` → `data_sources[0].id` (see `lib/notion/get-primary-data-source.ts`).
- Filters use `property` + `type: "people"` + `people: { contains: "<notion-user-uuid>" }`, combined with top-level `{ or: [ … ] }` for multiple assignees.
