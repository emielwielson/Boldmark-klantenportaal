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

/** Parallel batch size for `users.retrieve` (stay under Notion rate limits). */
const RETRIEVE_CONCURRENCY = 8;

async function retrieveFirstMatchingPersonId(
  notion: Client,
  candidateIds: string[],
  targetEmail: string,
  attemptedIds: Set<string>,
): Promise<string | null> {
  const toTry = candidateIds.filter((id) => {
    if (attemptedIds.has(id)) return false;
    attemptedIds.add(id);
    return true;
  });

  for (let i = 0; i < toTry.length; i += RETRIEVE_CONCURRENCY) {
    const chunk = toTry.slice(i, i + RETRIEVE_CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (userId) => {
        try {
          const user = await notion.users.retrieve({ user_id: userId });
          if (!isPersonUser(user)) return null;
          const personEmail = user.person?.email;
          if (personEmail && normalizeEmail(personEmail) === targetEmail) {
            return user.id;
          }
          return null;
        } catch {
          return null;
        }
      }),
    );
    const hit = results.find((x) => x !== null);
    if (hit) return hit;
  }

  return null;
}

/**
 * Guests invited only to specific pages often do not appear in `users.list` with a matchable
 * email. This path walks task pages in order; on each page it resolves `KlantV2` user ids in
 * small parallel batches and **stops at the first** email match (no full-DB user retrieve pass).
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

  const attemptedIds = new Set<string>();
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      result_type: "page",
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const row of res.results) {
      if (row.object !== "page" || !("properties" in row)) continue;

      const idsOnPage = extractKlantV2PersonIds(
        row as PageObjectResponse,
        klantV2Property,
      );

      const match = await retrieveFirstMatchingPersonId(
        notion,
        idsOnPage,
        target,
        attemptedIds,
      );
      if (match) {
        return [match];
      }
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return [];
}
