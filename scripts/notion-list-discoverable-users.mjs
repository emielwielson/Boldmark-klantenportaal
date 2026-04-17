/**
 * Lists people the integration can see for portal matching:
 * (A) workspace users from users.list (person + email when present)
 * (B) distinct Notion user ids on KlantV2 across all task pages, with users.retrieve details
 *
 * Usage:
 *   node --env-file=.env.local scripts/notion-list-discoverable-users.mjs
 *
 * Requires: NOTION_TOKEN, NOTION_TASKS_DATABASE_ID, NOTION_KLANTV2_PROPERTY (optional, default KlantV2)
 */
import { Client, APIErrorCode, isNotionClientError } from "@notionhq/client";

const token = process.env.NOTION_TOKEN?.trim();
const rawTasksId = process.env.NOTION_TASKS_DATABASE_ID?.trim();
const klantV2 =
  process.env.NOTION_KLANTV2_PROPERTY?.trim() || "KlantV2";

function normalizeId(raw) {
  const trimmed = raw.trim();
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(trimmed)) return trimmed.toLowerCase();
  const compact = trimmed.replace(/-/g, "");
  if (/^[0-9a-f]{32}$/i.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`.toLowerCase();
  }
  throw new Error("Invalid NOTION_TASKS_DATABASE_ID");
}

async function resolveDataSourceId(notion, id) {
  try {
    const db = await notion.databases.retrieve({ database_id: id });
    if (!db.data_sources?.length) {
      throw new Error("Database has no data_sources");
    }
    return db.data_sources[0].id;
  } catch (e) {
    if (isNotionClientError(e) && e.code === APIErrorCode.ObjectNotFound) {
      await notion.dataSources.retrieve({ data_source_id: id });
      return id;
    }
    throw e;
  }
}

function extractKlantV2UserIds(page, propertyName) {
  const props = page.properties || {};
  const want = propertyName.trim().toLowerCase();
  let key = Object.keys(props).find((k) => k.trim().toLowerCase() === want);
  if (!key && Object.hasOwn(props, propertyName)) key = propertyName;
  if (!key) return [];
  const prop = props[key];
  if (!prop || prop.type !== "people") return [];
  return (prop.people || [])
    .filter((p) => p.object === "user" && typeof p.id === "string")
    .map((p) => p.id);
}

const RETRIEVE_CONCURRENCY = 6;

async function mapWithConcurrency(ids, fn) {
  const out = [];
  for (let i = 0; i < ids.length; i += RETRIEVE_CONCURRENCY) {
    const chunk = ids.slice(i, i + RETRIEVE_CONCURRENCY);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

async function main() {
  if (!token) {
    console.error("Missing NOTION_TOKEN");
    process.exit(1);
  }
  if (!rawTasksId) {
    console.error("Missing NOTION_TASKS_DATABASE_ID");
    process.exit(1);
  }

  const tasksId = normalizeId(rawTasksId);
  const notion = new Client({ auth: token });

  console.log("=== A. Workspace users (users.list, type = person) ===\n");

  const listIds = new Set();
  let cursor;
  do {
    const res = await notion.users.list({
      start_cursor: cursor,
      page_size: 100,
    });
    for (const u of res.results) {
      if (u.type !== "person") continue;
      listIds.add(u.id);
      const email = u.person?.email ?? "(no email on list response)";
      console.log(`  ${u.id}  email: ${email}`);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  console.log(`\nTotal person rows from users.list: ${listIds.size}\n`);

  console.log(
    `=== B. People on "${klantV2}" (task pages → distinct user ids → users.retrieve) ===\n`,
  );

  const dataSourceId = await resolveDataSourceId(notion, tasksId);
  const fromTasks = new Set();
  cursor = undefined;
  let pageCount = 0;
  let samplePage = null;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      result_type: "page",
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const row of res.results) {
      if (row.object !== "page" || !row.properties) continue;
      pageCount += 1;
      if (!samplePage) {
        samplePage = row;
      }
      for (const id of extractKlantV2UserIds(row, klantV2)) {
        fromTasks.add(id);
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  console.log(`  Task pages scanned: ${pageCount}`);
  console.log(`  Distinct KlantV2 user ids (property name "${klantV2}"): ${fromTasks.size}`);

  if (pageCount > 0 && fromTasks.size === 0 && samplePage?.properties) {
    const peoplePropNames = Object.entries(samplePage.properties)
      .filter(([, v]) => v && v.type === "people")
      .map(([name]) => name);
    console.log(
      `\n  [hint] No user ids on "${klantV2}". People-type columns on a sample task row: ${peoplePropNames.length ? peoplePropNames.join(", ") : "(none)"}`,
    );
    if (peoplePropNames.length && !peoplePropNames.includes(klantV2)) {
      console.log(
        `  [hint] Set NOTION_KLANTV2_PROPERTY to one of these names (or fix spelling).`,
      );
    }
  }
  console.log("");

  const sorted = [...fromTasks].sort();

  const details = await mapWithConcurrency(sorted, async (userId) => {
    try {
      const u = await notion.users.retrieve({ user_id: userId });
      const email =
        u.type === "person"
          ? u.person?.email ?? "(person, no email)"
          : "(not a person user)";
      const inList = listIds.has(userId) ? "yes" : "no";
      return {
        userId,
        ok: true,
        line: `  ${userId}  email: ${email}  in_users.list: ${inList}`,
        resolvedEmail:
          u.type === "person" && u.person?.email
            ? u.person.email.trim().toLowerCase()
            : null,
      };
    } catch (e) {
      return {
        userId,
        ok: false,
        line: `  ${userId}  retrieve failed: ${e instanceof Error ? e.message : String(e)}`,
        resolvedEmail: null,
      };
    }
  });

  for (const d of details) {
    console.log(d.line);
  }

  const emailsFromKlantV2 = [
    ...new Set(
      details
        .map((d) => d.resolvedEmail)
        .filter((e) => typeof e === "string" && e.length > 0),
    ),
  ].sort();

  console.log("\n=== C. Distinct emails from Klant V2 (users.retrieve → person.email) ===\n");
  if (emailsFromKlantV2.length === 0) {
    console.log(
      "  (none — no person.email on retrieved users, or no people on this column)",
    );
  } else {
    for (const em of emailsFromKlantV2) {
      console.log(`  ${em}`);
    }
    console.log(
      `\n  Portal login (Supabase) must match one of these addresses (case-insensitive).`,
    );
  }

  const onlyOnTasks = sorted.filter((id) => !listIds.has(id));
  console.log(
    `\n=== Summary ===\n  KlantV2 ids not present in users.list (typical guests): ${onlyOnTasks.length}`,
  );
  if (onlyOnTasks.length) {
    console.log(
      "  (Portal login email must match person.email from users.retrieve for one of these ids.)",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
