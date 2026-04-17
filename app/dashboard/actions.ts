"use server";

import {
  APIErrorCode,
  isFullPage,
  isHTTPResponseError,
  isNotionClientError,
} from "@notionhq/client";
import { getKlantV2PropertyName } from "@/lib/notion/config";
import { getNotionClient } from "@/lib/notion/client";
import { mapPageToTask } from "@/lib/notion/map-page-to-task";
import { plainValueToNotionPropertyUpdate } from "@/lib/notion/map-task-to-notion-properties";
import { logPortalEvent } from "@/lib/observability/server-log";
import {
  assertUserTaskAccess,
  TaskScopeError,
} from "@/lib/permissions/task-scope";
import { createClient } from "@/lib/supabase/server";

/**
 * Updates one Notion property from a plain value (matches cached `type`).
 * Order: scope check → Notion `pages.update` → `pages.retrieve` → cache upsert (last-write-wins, FR-12).
 */
export async function updateTaskProperty(
  notionPageId: string,
  propertyName: string,
  plainValue: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Niet ingelogd." };
  }

  try {
    await assertUserTaskAccess(supabase, notionPageId);

    const { data: row, error: rowErr } = await supabase
      .from("notion_sync_cache")
      .select("properties")
      .eq("notion_page_id", notionPageId)
      .maybeSingle();

    if (rowErr || !row) {
      logPortalEvent("warn", {
        event: "task_cache_row_missing",
        userId: user.id,
        notionPageId,
        message: rowErr?.message ?? "no_row",
      });
      return { ok: false, error: "Taak niet gevonden." };
    }

    const props = row.properties as Record<string, unknown>;
    const cached = props[propertyName];
    if (cached === undefined) {
      logPortalEvent("warn", {
        event: "property_mapping_mismatch",
        userId: user.id,
        notionPageId,
        propertyName,
        reason: "missing_from_cache_snapshot",
      });
      return { ok: false, error: "Onbekende eigenschap." };
    }

    let updatePayload;
    try {
      updatePayload = plainValueToNotionPropertyUpdate(cached, plainValue);
    } catch (mapErr) {
      const msg =
        mapErr instanceof Error ? mapErr.message : String(mapErr);
      const propType =
        typeof cached === "object" && cached !== null && "type" in cached
          ? String((cached as { type?: unknown }).type)
          : undefined;
      logPortalEvent("warn", {
        event: "property_type_unsupported",
        userId: user.id,
        notionPageId,
        propertyName,
        propertyType: propType,
        message: msg,
      });
      return {
        ok: false,
        error: msg,
      };
    }
    const notion = getNotionClient();

    await notion.pages.update({
      page_id: notionPageId,
      properties: {
        [propertyName]: updatePayload,
      },
    });

    const pageRes = await notion.pages.retrieve({ page_id: notionPageId });
    if (!isFullPage(pageRes)) {
      logPortalEvent("warn", {
        event: "task_update_not_full_page",
        userId: user.id,
        notionPageId,
        propertyName,
      });
      return {
        ok: false,
        error:
          "Notion gaf geen volledige pagina terug; synchroniseer opnieuw en probeer het nog eens.",
      };
    }

    const task = mapPageToTask(pageRes, getKlantV2PropertyName());
    const now = new Date().toISOString();

    const { error: upErr } = await supabase.from("notion_sync_cache").upsert(
      {
        notion_page_id: task.notion_page_id,
        properties: task.properties,
        klant_v2_person_ids: task.klant_v2_person_ids,
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: "notion_page_id" },
    );

    if (upErr) {
      logPortalEvent("error", {
        event: "cache_upsert_after_notion_failed",
        userId: user.id,
        notionPageId,
        message: upErr.message,
      });
      return { ok: false, error: upErr.message };
    }

    return { ok: true };
  } catch (e) {
    if (e instanceof TaskScopeError) {
      logPortalEvent("warn", {
        event: "task_access_denied",
        userId: user.id,
        notionPageId,
        message: e.message,
      });
      return { ok: false, error: e.message };
    }
    if (isNotionClientError(e)) {
      const rateLimited =
        isHTTPResponseError(e) &&
        (e.status === 429 || e.code === APIErrorCode.RateLimited);
      const msg = rateLimited
        ? "Notion is tijdelijk traag (rate limit). Probeer het zo weer."
        : e.message;
      logPortalEvent("error", {
        event: rateLimited ? "notion_rate_limited" : "notion_api_error",
        userId: user.id,
        notionPageId,
        propertyName,
        notionCode: e.code,
        httpStatus: isHTTPResponseError(e) ? e.status : undefined,
        message: e.message,
      });
      return { ok: false, error: msg };
    }
    const fallback = e instanceof Error ? e.message : "Onbekende fout.";
    logPortalEvent("error", {
      event: "task_update_failed",
      userId: user.id,
      notionPageId,
      propertyName,
      message: fallback,
    });
    return {
      ok: false,
      error: fallback,
    };
  }
}
