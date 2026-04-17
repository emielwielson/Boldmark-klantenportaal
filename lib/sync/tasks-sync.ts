import { createClient } from "@/lib/supabase/server";
import { getNotionClient } from "@/lib/notion/client";
import { isNotionTasksDatabaseConfigured } from "@/lib/notion/config";
import { listInScopeTasks } from "@/lib/notion/tasks";
import { resolveAndPersistPersonScope } from "@/lib/person-resolver";

export type SyncTasksResult =
  | {
      kind: "ok";
      syncedAt: string;
      taskCount: number;
      /** Latest `last_synced_at` among rows the user can still read (for FR-26 messaging). */
      cacheLastSyncedAt: string | null;
    }
  | { kind: "notion_not_configured"; skipped: true }
  | { kind: "tasks_db_not_configured" }
  | { kind: "no_notion_person"; fr25: true }
  | {
      kind: "error";
      message: string;
      usedStaleCache: boolean;
      cacheLastSyncedAt: string | null;
    };

async function maxCacheLastSyncedAt(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("notion_sync_cache")
    .select("last_synced_at")
    .order("last_synced_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  return data[0]!.last_synced_at ?? null;
}

/**
 * Resolves person scope, pulls in-scope tasks from Notion, upserts `notion_sync_cache`,
 * and deletes stale visible rows (FR-28). Call from server-only contexts with the user JWT.
 */
export async function syncTasksForUser(opts: {
  userId: string;
  email: string;
}): Promise<SyncTasksResult> {
  const supabase = await createClient();

  const resolve = await resolveAndPersistPersonScope({
    userId: opts.userId,
    email: opts.email,
  });

  if (resolve.skipped) {
    return { kind: "notion_not_configured", skipped: true };
  }

  if (!isNotionTasksDatabaseConfigured()) {
    return { kind: "tasks_db_not_configured" };
  }

  if (resolve.notionPersonIds.length === 0) {
    return { kind: "no_notion_person", fr25: true };
  }

  const cacheLastSyncedAtBefore = await maxCacheLastSyncedAt(supabase);

  try {
    const notion = getNotionClient();
    const tasks = await listInScopeTasks(notion, resolve.notionPersonIds);
    const syncedAt = new Date().toISOString();
    const fetchedIds = new Set(tasks.map((t) => t.notion_page_id));

    if (tasks.length > 0) {
      const rows = tasks.map((task) => ({
        notion_page_id: task.notion_page_id,
        properties: task.properties,
        klant_v2_person_ids: task.klant_v2_person_ids,
        last_synced_at: syncedAt,
        updated_at: syncedAt,
      }));

      const { error: upsertErr } = await supabase
        .from("notion_sync_cache")
        .upsert(rows, { onConflict: "notion_page_id" });

      if (upsertErr) {
        throw new Error(upsertErr.message);
      }
    }

    const { data: visibleRows, error: visErr } = await supabase
      .from("notion_sync_cache")
      .select("notion_page_id");

    if (visErr) {
      throw new Error(visErr.message);
    }

    const staleIds = (visibleRows ?? [])
      .map((r) => r.notion_page_id)
      .filter((id) => !fetchedIds.has(id));

    for (const notionPageId of staleIds) {
      const { error: delErr } = await supabase
        .from("notion_sync_cache")
        .delete()
        .eq("notion_page_id", notionPageId);
      if (delErr) {
        console.error(
          "[sync] failed to delete stale cache row",
          notionPageId,
          delErr.message,
        );
      }
    }

    const cacheLastSyncedAt = await maxCacheLastSyncedAt(supabase);

    return {
      kind: "ok",
      syncedAt,
      taskCount: tasks.length,
      cacheLastSyncedAt: cacheLastSyncedAt ?? cacheLastSyncedAtBefore,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const cacheLastSyncedAt = await maxCacheLastSyncedAt(supabase);
    return {
      kind: "error",
      message,
      usedStaleCache: Boolean(cacheLastSyncedAt),
      cacheLastSyncedAt,
    };
  }
}
