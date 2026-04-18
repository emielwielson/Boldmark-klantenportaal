import { SignOutButton } from "@/components/auth/sign-out-button";
import { TaskList } from "@/components/tasks/task-list";
import type { CachedTaskRow } from "@/components/tasks/task-row-editor";
import { AppBanner } from "@/components/ui/AppBanner";
import { getNotionClient } from "@/lib/notion/client";
import {
  getKlantV2PropertyName,
  isNotionConfigured,
} from "@/lib/notion/config";
import { fetchSelectLikeOptionNamesByPropertyId } from "@/lib/notion/data-source-select-options";
import { logPortalEvent } from "@/lib/observability/server-log";
import { syncTasksForUser } from "@/lib/sync/tasks-sync";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function formatNlTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=session_expired");
  }

  let syncBanner: {
    variant: "ok" | "warn" | "denied" | "config";
    title: string;
    detail?: string;
    lastSyncedLabel?: string;
  } | null = null;

  if (user.email) {
    const result = await syncTasksForUser({
      userId: user.id,
      email: user.email,
    });

    if (result.kind === "ok") {
      syncBanner = {
        variant: "ok",
        title: "Synchronisatie gelukt",
        detail: `${result.taskCount} ${result.taskCount === 1 ? "taak" : "taken"} bijgewerkt.`,
        lastSyncedLabel: formatNlTimestamp(
          result.cacheLastSyncedAt ?? result.syncedAt,
        ),
      };
    } else if (result.kind === "error") {
      syncBanner = {
        variant: "warn",
        title: "Synchronisatie mislukt",
        detail: result.message,
        lastSyncedLabel: result.usedStaleCache
          ? formatNlTimestamp(result.cacheLastSyncedAt)
          : undefined,
      };
    } else if (result.kind === "no_notion_person") {
      syncBanner = {
        variant: "denied",
        title: "Geen toegang",
        detail:
          "Je e-mailadres komt niet overeen met een Notion-gebruiker voor dit portaal. Neem contact op met je beheerder.",
      };
    } else if (result.kind === "tasks_db_not_configured") {
      syncBanner = {
        variant: "config",
        title: "Notion-taken database ontbreekt",
        detail:
          "Zet NOTION_TASKS_DATABASE_ID in de serveromgeving om taken te synchroniseren.",
      };
    } else if (result.kind === "notion_not_configured") {
      syncBanner = {
        variant: "config",
        title: "Notion is niet geconfigureerd",
        detail:
          "Zet NOTION_TOKEN in de serveromgeving om synchronisatie in te schakelen.",
      };
    }
  }

  const blockTaskUi =
    syncBanner?.variant === "denied" || syncBanner?.variant === "config";

  let cacheError: string | null = null;
  let cachedTasks: CachedTaskRow[] = [];

  if (!blockTaskUi) {
    const { data, error } = await supabase
      .from("notion_sync_cache")
      .select("notion_page_id, properties, last_synced_at")
      .order("last_synced_at", { ascending: false });

    if (error) {
      cacheError = error.message;
    } else {
      cachedTasks = (data ?? []) as CachedTaskRow[];
    }
  }

  const klantV2PropertyName = getKlantV2PropertyName();

  let propertyOptionsById: Record<string, string[]> = {};
  if (!blockTaskUi && !cacheError && isNotionConfigured()) {
    try {
      propertyOptionsById = await fetchSelectLikeOptionNamesByPropertyId(
        getNotionClient(),
      );
    } catch (e) {
      logPortalEvent("warn", {
        event: "data_source_select_options_failed",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-ink/70">
              Ingelogd als{" "}
              <span className="font-medium text-ink">{user.email}</span>
            </p>
            {syncBanner?.lastSyncedLabel && syncBanner.variant !== "denied" ? (
              <p className="mt-2 text-xs text-ink/55">
                Laatst bijgewerkt: {syncBanner.lastSyncedLabel}
              </p>
            ) : null}
          </div>
          <SignOutButton />
        </header>

        {syncBanner ? (
          <AppBanner
            variant={syncBanner.variant}
            title={syncBanner.title}
            detail={syncBanner.detail}
          />
        ) : null}

        {cacheError ? (
          <AppBanner
            variant="warn"
            title="Cache kon niet geladen worden"
            detail={cacheError}
          />
        ) : null}

        {!blockTaskUi && !cacheError ? (
          <TaskList
            tasks={cachedTasks}
            klantV2PropertyName={klantV2PropertyName}
            propertyOptionsById={propertyOptionsById}
          />
        ) : null}
      </div>
    </div>
  );
}
