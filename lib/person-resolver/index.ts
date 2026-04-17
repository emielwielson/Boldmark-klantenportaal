import type { Client, UserObjectResponse } from "@notionhq/client";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getNotionClient } from "@/lib/notion/client";
import { isNotionConfigured } from "@/lib/notion/config";

import { findGuestPersonIdsByEmailViaTaskPages } from "@/lib/person-resolver/guest-person-ids-from-tasks";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPersonUser(
  u: UserObjectResponse,
): u is UserObjectResponse & { type: "person" } {
  return u.type === "person";
}

/**
 * Resolves Notion person user ids for the login email:
 *
 * 1. **Workspace list:** paginate `users.list` and match `person.email` (case-insensitive).
 * 2. **Guests:** if that yields no ids, walk task pages and batch-`users.retrieve` `KlantV2`
 *    ids until `person.email` matches — **stops at first match** (see
 *    `guest-person-ids-from-tasks.ts`).
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

  if (matches.length > 0) {
    return matches;
  }

  return findGuestPersonIdsByEmailViaTaskPages(notion, email);
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
  /** True when ids came from existing `user_person_scope` rows (no Notion user resolution). */
  scopeFromDatabase?: boolean;
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

  const supabase = await createSupabaseServerClient();

  const { data: existingScope, error: scopeErr } = await supabase
    .from("user_person_scope")
    .select("notion_person_id")
    .eq("user_id", opts.userId);

  if (scopeErr) {
    throw new Error(`user_person_scope select: ${scopeErr.message}`);
  }

  if (existingScope?.length) {
    return {
      notionPersonIds: existingScope.map((r) => r.notion_person_id),
      skipped: false,
      scopeFromDatabase: true,
    };
  }

  const notion = getNotionClient();
  const notionPersonIds = await findNotionPersonIdsByEmail(notion, opts.email);

  await persistUserPersonScope(supabase, opts.userId, notionPersonIds);

  return { notionPersonIds, skipped: false };
}
