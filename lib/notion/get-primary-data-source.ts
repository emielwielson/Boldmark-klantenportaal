import type { Client } from "@notionhq/client";
import { APIErrorCode, isNotionClientError } from "@notionhq/client";

/**
 * Resolves the `data_source_id` used for `dataSources.query`.
 *
 * `NOTION_TASKS_DATABASE_ID` may be either:
 * - A **database** id — we read `databases.retrieve` and use the first `data_sources` entry (typical single-source DB).
 * - A **data source** id (Notion API v5+) — we validate with `dataSources.retrieve` and use it directly.
 */
export async function getPrimaryDataSourceId(
  client: Client,
  databaseOrDataSourceIdFromEnv: string,
): Promise<string> {
  try {
    const db = await client.databases.retrieve({
      database_id: databaseOrDataSourceIdFromEnv,
    });
    if (!("data_sources" in db) || !db.data_sources?.length) {
      throw new Error(
        "Could not resolve a data_source_id for this database (empty data_sources). Ensure the integration can access the Tasks database.",
      );
    }
    return db.data_sources[0]!.id;
  } catch (e) {
    const isObjectNotFound =
      isNotionClientError(e) && e.code === APIErrorCode.ObjectNotFound;

    if (!isObjectNotFound) {
      throw e;
    }

    try {
      await client.dataSources.retrieve({
        data_source_id: databaseOrDataSourceIdFromEnv,
      });
      return databaseOrDataSourceIdFromEnv;
    } catch (inner) {
      throw new Error(
        `NOTION_TASKS_DATABASE_ID is neither a database id nor a data_source_id the integration can access. ` +
          `First error (as database): ${e instanceof Error ? e.message : String(e)}. ` +
          `Second error (as data source): ${inner instanceof Error ? inner.message : String(inner)}`,
      );
    }
  }
}
