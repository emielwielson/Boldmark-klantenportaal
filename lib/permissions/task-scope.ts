type SupabaseServer = Awaited<
  ReturnType<(typeof import("@/lib/supabase/server"))["createClient"]>
>;

/**
 * Defense-in-depth scope check (FR-18, FR-19): if the cache row is readable under RLS
 * for this JWT, the user’s `notion_person_id` overlaps the task’s `klant_v2_person_ids`.
 */
export async function userHasTaskAccess(
  supabase: SupabaseServer,
  notionPageId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("notion_sync_cache")
    .select("notion_page_id")
    .eq("notion_page_id", notionPageId)
    .maybeSingle();

  if (error) {
    console.error("[task-scope] userHasTaskAccess:", error.message);
    return false;
  }

  return data != null;
}

export class TaskScopeError extends Error {
  constructor(message = "Geen toegang tot deze taak.") {
    super(message);
    this.name = "TaskScopeError";
  }
}

export async function assertUserTaskAccess(
  supabase: SupabaseServer,
  notionPageId: string,
): Promise<void> {
  const ok = await userHasTaskAccess(supabase, notionPageId);
  if (!ok) {
    throw new TaskScopeError();
  }
}
