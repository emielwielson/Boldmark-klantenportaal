import type { Client, UserObjectResponse } from "@notionhq/client";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getNotionClient } from "@/lib/notion/client";
import { isNotionConfigured } from "@/lib/notion/config";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPersonUser(
  u: UserObjectResponse,
): u is UserObjectResponse & { type: "person" } {
  return u.type === "person";
}

/**
 * Lists all workspace users visible to the integration and returns Notion person user ids
 * whose `person.email` matches the given email (case-insensitive).
 *
 * **Spike notes (4.2):** `users.list` returns full `UserObjectResponse` entries. For `type:
 * "person"`, `person.email` is optional in the API; when missing, email match is impossible
 * for that row — use `users.retrieve({ user_id })` if you need to refresh a partial user.
 * Guests invited only to specific pages may not appear in `users.list`; resolving them may
 * require another strategy (e.g. collecting ids from task pages — not implemented here).
 */
export async function findNotionPersonIdsByEmail(
  notion: Client,
  email: string,
): Promise<string[]> {
  const target = normalizeEmail(email);
  const matches: string[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.users.list({
      start_cursor: cursor,
      page_size: 100,
    });
    for (const user of res.results) {
      if (!isPersonUser(user)) continue;
      const personEmail = user.person?.email;
      if (personEmail && normalizeEmail(personEmail) === target) {
        matches.push(user.id);
      }
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return matches;
}

/**
 * Replaces rows in `user_person_scope` for this auth user with the resolved Notion person ids.
 * Idempotent: delete all for user, then insert current set.
 */
export async function persistUserPersonScope(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  notionPersonIds: string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("user_person_scope")
    .delete()
    .eq("user_id", userId);
  if (delErr) {
    throw new Error(`user_person_scope delete: ${delErr.message}`);
  }
  if (notionPersonIds.length === 0) return;

  const { error: insErr } = await supabase.from("user_person_scope").insert(
    notionPersonIds.map((notion_person_id) => ({
      user_id: userId,
      notion_person_id,
    })),
  );
  if (insErr) {
    throw new Error(`user_person_scope insert: ${insErr.message}`);
  }
}

export type ResolveAndPersistResult = {
  notionPersonIds: string[];
  /** True when NOTION_TOKEN was missing — no Notion or DB calls were made. */
  skipped: boolean;
};

/**
 * Resolves the logged-in user's email to Notion person UUIDs and persists them under RLS.
 * Call from server-only code paths (Server Components / route handlers) with the user JWT.
 */
export async function resolveAndPersistPersonScope(opts: {
  userId: string;
  email: string;
}): Promise<ResolveAndPersistResult> {
  if (!isNotionConfigured()) {
    return { notionPersonIds: [], skipped: true };
  }

  const notion = getNotionClient();
  const notionPersonIds = await findNotionPersonIdsByEmail(notion, opts.email);

  const supabase = await createSupabaseServerClient();
  await persistUserPersonScope(supabase, opts.userId, notionPersonIds);

  return { notionPersonIds, skipped: false };
}
