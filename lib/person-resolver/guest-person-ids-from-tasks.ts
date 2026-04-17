import type {
  Client,
  PageObjectResponse,
  UserObjectResponse,
} from "@notionhq/client";

import {
  getKlantV2PropertyName,
  getNotionTasksDatabaseId,
  isNotionTasksDatabaseConfigured,
} from "@/lib/notion/config";
import { getPrimaryDataSourceId } from "@/lib/notion/get-primary-data-source";
import { extractKlantV2PersonIds } from "@/lib/notion/map-page-to-task";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPersonUser(
  u: UserObjectResponse,
): u is UserObjectResponse & { type: "person" } {
  return u.type === "person";
}

/**
 * Guests invited only to specific pages often do not appear in `users.list` with a matchable
 * email. This path paginates **all** task rows in the Tasks database (no people filter),
 * collects every Notion user id on `KlantV2`, then calls `users.retrieve` until `person.email`
 * matches the login email.
 *
 * **Cost:** One full database scan per resolution when the workspace list path is empty; one
 * retrieve per distinct person id on KlantV2 across those pages. Acceptable for typical DB sizes;
 * revisit if the Tasks DB grows very large (caching, incremental strategies — task 7).
 */
export async function findGuestPersonIdsByEmailViaTaskPages(
  notion: Client,
  email: string,
): Promise<string[]> {
  if (!isNotionTasksDatabaseConfigured()) {
    return [];
  }

  const target = normalizeEmail(email);
  const tasksDbOrDataSourceId = getNotionTasksDatabaseId();
  const klantV2Property = getKlantV2PropertyName();
  const dataSourceId = await getPrimaryDataSourceId(
    notion,
    tasksDbOrDataSourceId,
  );

  const candidateIds = new Set<string>();
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      result_type: "page",
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const row of res.results) {
      if (row.object === "page" && "properties" in row) {
        for (const id of extractKlantV2PersonIds(
          row as PageObjectResponse,
          klantV2Property,
        )) {
          candidateIds.add(id);
        }
      }
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  const matches: string[] = [];

  for (const userId of candidateIds) {
    try {
      const user = await notion.users.retrieve({ user_id: userId });
      if (!isPersonUser(user)) continue;
      const personEmail = user.person?.email;
      if (personEmail && normalizeEmail(personEmail) === target) {
        matches.push(user.id);
      }
    } catch {
      // Missing user access or deleted id — skip
    }
  }

  return matches;
}
