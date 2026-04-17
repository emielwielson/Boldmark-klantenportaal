/**
 * Smoke test: NOTION_TOKEN + NOTION_TASKS_DATABASE_ID can reach Notion as database or data source.
 * Usage: node --env-file=.env.local scripts/notion-verify-tasks-id.mjs
 * Optional: NOTION_TASKS_DATABASE_ID=... prefix to test a specific id.
 */
import { Client, APIErrorCode, isNotionClientError } from "@notionhq/client";

const token = process.env.NOTION_TOKEN?.trim();
const rawId = process.env.NOTION_TASKS_DATABASE_ID?.trim();

function normalizeId(raw) {
  const trimmed = raw.trim();
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(trimmed)) return trimmed.toLowerCase();
  const compact = trimmed.replace(/-/g, "");
  if (/^[0-9a-f]{32}$/i.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`.toLowerCase();
  }
  throw new Error("Invalid id format");
}

async function main() {
  if (!token) {
    console.error("Missing NOTION_TOKEN");
    process.exit(1);
  }
  if (!rawId) {
    console.error("Missing NOTION_TASKS_DATABASE_ID");
    process.exit(1);
  }

  let id;
  try {
    id = normalizeId(rawId);
  } catch {
    console.error("Invalid NOTION_TASKS_DATABASE_ID format");
    process.exit(1);
  }

  console.log("Normalized id:", id);

  const notion = new Client({ auth: token });

  try {
    const db = await notion.databases.retrieve({ database_id: id });
    console.log("OK: Notion accepted this as a database_id.");
    console.log("    object:", db.object, "| data_sources:", db.data_sources?.length ?? 0);
    process.exit(0);
  } catch (e) {
    if (
      isNotionClientError(e) &&
      e.code === APIErrorCode.ObjectNotFound
    ) {
      try {
        const ds = await notion.dataSources.retrieve({
          data_source_id: id,
        });
        console.log("OK: Notion accepted this as a data_source_id.");
        console.log("    object:", ds.object);
        process.exit(0);
      } catch (e2) {
        console.error("Not found as database_id or data_source_id.");
        console.error("  database error:", e.message);
        console.error("  data_source error:", e2.message);
        process.exit(1);
      }
    }
    console.error("Notion API error:", e);
    process.exit(1);
  }
}

main();
