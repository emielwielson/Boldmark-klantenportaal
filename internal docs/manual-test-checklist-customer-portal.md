# Manual test checklist — Custom Customer Portal

Aligned with [prd-custom-customer-portal.md §9 Success Metrics](./prd-custom-customer-portal.md).  
Use **staging or local** with test accounts; never paste secrets or magic links into tickets.

## 1. Access correctness (§9.1)

- [ ] **Account A** (email on `KlantV2` for task X): dashboard lists task X; can open fields and save where editable.
- [ ] **Account B** (different email, not on task X): cannot see task X; cannot guess `notion_page_id` to load or edit it (RLS + server scope).
- [ ] **Valid assignee** on `KlantV2` is not incorrectly denied (no false “Geen toegang” if email matches a Notion person used on a task).

## 2. Performance — smoke (§9.2)

- [ ] After login, dashboard shows cached tasks within **~2 seconds** under normal conditions (subjective stopwatch; depends on network and Notion).

## 3. Sync reliability (§9.3)

- [ ] **Login** triggers sync; **browser refresh** on `/dashboard` triggers sync; `last_synced_at` / banner messaging updates sensibly.
- [ ] With **invalid or revoked `NOTION_TOKEN`** (staging only): user sees a clear error; if stale cache exists, UI indicates staleness per FR-26 (no silent “fresh” data).

## 4. User experience (§9.4)

- [ ] **Magic link** flow: request link → open email → complete login → land on dashboard with tasks (no mandatory Notion UI for normal use).

## 5. Maintainability / round-trip (§9.5)

- [ ] **Portal → Notion:** Edit a field in the portal → confirm value in Notion for the same page.
- [ ] **Notion → Portal:** Change the same field in Notion → refresh dashboard → portal shows updated value (last-write-wins documented elsewhere).

## 6. Security hygiene (FR-7, FR-20)

- [ ] Browser **View Source / Network**: no `NOTION_TOKEN` or non-public Supabase secret keys in client bundles.
- [ ] Notion access is only for the configured **Tasks** database (`NOTION_TASKS_DATABASE_ID`), not user-supplied IDs.

---

**Sign-off**

| Date | Environment | Tester | Notes |
|------|-------------|--------|-------|
|      |             |        |       |
