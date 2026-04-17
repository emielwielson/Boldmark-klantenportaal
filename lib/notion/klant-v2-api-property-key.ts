import type { Client } from "@notionhq/client";

import { getKlantV2PropertyName, getNotionTasksDatabaseId } from "@/lib/notion/config";
import { getPrimaryDataSourceId } from "@/lib/notion/get-primary-data-source";

type Cache = { dbEnv: string; configured: string; apiKey: string };

let cache: Cache | null = null;

/**
 * Exact `property` string for `dataSources.query` filters: comes from the data source schema
 * (handles UI titles vs API keys, including stray spaces in column names).
 */
export async function getKlantV2ApiPropertyKey(notion: Client): Promise<string> {
  const configured = getKlantV2PropertyName();
  const dbEnv = getNotionTasksDatabaseId();

  if (cache && cache.dbEnv === dbEnv && cache.configured === configured) {
    return cache.apiKey;
  }

  const dataSourceId = await getPrimaryDataSourceId(notion, dbEnv);
  const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const want = configured.trim().toLowerCase();

  for (const [apiKey, prop] of Object.entries(ds.properties)) {
    if (prop.type !== "people") continue;
    const name = prop.name.trim().toLowerCase();
    if (name === want || apiKey.trim().toLowerCase() === want) {
      cache = { dbEnv, configured, apiKey };
      return apiKey;
    }
  }

  throw new Error(
    `No People column matches NOTION_KLANTV2_PROPERTY="${configured}". Open the Tasks database in Notion and copy the column title exactly (including spaces).`,
  );
}

/** For tests or after schema changes */
export function clearKlantV2ApiPropertyKeyCache(): void {
  cache = null;
}
