import type { Client } from "@notionhq/client";

/**
 * Notion API v5+ queries pages via `dataSources.query` using a data_source_id.
 * A database exposes one or more data sources; we use the first entry (typical single-source DB).
 */
export async function getPrimaryDataSourceId(
  client: Client,
  databaseId: string,
): Promise<string> {
  const db = await client.databases.retrieve({ database_id: databaseId });
  if (!("data_sources" in db) || !db.data_sources?.length) {
    throw new Error(
      "Could not resolve a data_source_id for this database (empty data_sources). Ensure the integration can access the Tasks database.",
    );
  }
  return db.data_sources[0]!.id;
}
