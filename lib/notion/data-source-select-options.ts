import type { Client } from "@notionhq/client";

import { getNotionTasksDatabaseId } from "@/lib/notion/config";
import { getPrimaryDataSourceId } from "@/lib/notion/get-primary-data-source";

/**
 * Reads select / status / multi_select **option names** from the Tasks data source schema.
 * Page cache rows do not include full option lists (only the current value), so the UI needs this
 * to populate dropdowns (e.g. "Categorie").
 */
export async function fetchSelectLikeOptionNamesByPropertyId(
  notion: Client,
): Promise<Record<string, string[]>> {
  const dbId = getNotionTasksDatabaseId();
  const dataSourceId = await getPrimaryDataSourceId(notion, dbId);
  const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const out: Record<string, string[]> = {};

  for (const prop of Object.values(ds.properties ?? {})) {
    const p = prop as {
      id?: string;
      type?: string;
      select?: { options?: { name: string }[] };
      multi_select?: { options?: { name: string }[] };
      status?: { options?: { name: string }[] };
    };
    const id = p.id;
    if (!id) continue;

    if (p.type === "select" && p.select?.options?.length) {
      out[id] = p.select.options.map((o) => o.name);
    } else if (p.type === "multi_select" && p.multi_select?.options?.length) {
      out[id] = p.multi_select.options.map((o) => o.name);
    } else if (p.type === "status" && p.status?.options?.length) {
      out[id] = p.status.options.map((o) => o.name);
    }
  }

  return out;
}
