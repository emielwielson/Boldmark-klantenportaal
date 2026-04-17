import type { Client, PageObjectResponse } from "@notionhq/client";

import type { Task } from "@/types/notion-task";

import {
  getKlantV2PropertyName,
  getNotionTasksDatabaseId,
} from "@/lib/notion/config";
import { getPrimaryDataSourceId } from "@/lib/notion/get-primary-data-source";
import { mapPageToTask } from "@/lib/notion/map-page-to-task";

/**
 * Queries the Tasks database (via its primary `data_source_id`, Notion API v5+) with a
 * compound **or** filter: KlantV2 People contains any resolved Notion user id (FR-5, FR-9, §8).
 *
 * **Trade-off:** Notion applies the filter server-side — suitable for large databases. If the
 * API rejected compound filters in a given workspace, the fallback would be paginate without
 * filter and filter in memory (not implemented; avoid for large DBs).
 */
export async function listInScopeTaskPages(
  notion: Client,
  opts: {
    databaseId: string;
    klantV2Property: string;
    notionPersonIds: string[];
  },
): Promise<PageObjectResponse[]> {
  if (opts.notionPersonIds.length === 0) {
    return [];
  }

  const dataSourceId = await getPrimaryDataSourceId(notion, opts.databaseId);
  const filter = {
    or: opts.notionPersonIds.map((id) => ({
      property: opts.klantV2Property,
      type: "people" as const,
      people: { contains: id },
    })),
  };

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      result_type: "page",
      filter,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const row of res.results) {
      if (row.object === "page" && "properties" in row) {
        pages.push(row as PageObjectResponse);
      }
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

/**
 * Convenience: env-based database id + property name, maps pages to `Task`.
 */
export async function listInScopeTasks(
  notion: Client,
  notionPersonIds: string[],
  overrides?: Partial<{ databaseId: string; klantV2Property: string }>,
): Promise<Task[]> {
  const databaseId = overrides?.databaseId ?? getNotionTasksDatabaseId();
  const klantV2Property =
    overrides?.klantV2Property ?? getKlantV2PropertyName();

  const pages = await listInScopeTaskPages(notion, {
    databaseId,
    klantV2Property,
    notionPersonIds,
  });

  return pages.map((p) => mapPageToTask(p, klantV2Property));
}
