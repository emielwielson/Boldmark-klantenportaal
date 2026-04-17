/**
 * Server-only Notion configuration (FR-20). Never import this from client components.
 */

/** 8-4-4-4-12 hex (any UUID version; Notion may emit v7+ which fail strict RFC 4122 variant checks). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PLAIN_32_HEX = /^[0-9a-f]{32}$/i;

/**
 * Notion UIs sometimes copy ids without hyphens. Accept both forms.
 */
export function normalizeNotionTasksId(raw: string): string {
  const trimmed = raw.trim();
  if (UUID_RE.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  const compact = trimmed.replace(/-/g, "");
  if (PLAIN_32_HEX.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`.toLowerCase();
  }
  throw new Error(
    `NOTION_TASKS_DATABASE_ID must be a UUID: 32 hex characters or 8-4-4-4-12 with hyphens (got: ${raw.slice(0, 16)}…)`,
  );
}

/** True when Notion integration env is present enough to call the API. */
export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim());
}

/** True when Tasks DB / data source id is set (required for data source queries). */
export function isNotionTasksDatabaseConfigured(): boolean {
  return Boolean(process.env.NOTION_TASKS_DATABASE_ID?.trim());
}

/**
 * KlantV2 (or renamed) people property — use env so renames are centralized (FR-27).
 */
export function getKlantV2PropertyName(): string {
  const name = process.env.NOTION_KLANTV2_PROPERTY?.trim() || "KlantV2";
  if (!name) {
    throw new Error("NOTION_KLANTV2_PROPERTY is empty");
  }
  return name;
}

/**
 * Validates and returns `NOTION_TASKS_DATABASE_ID` (UUID). Value may be the **database** id
 * or the **data source** id — see `getPrimaryDataSourceId`.
 */
export function getNotionTasksDatabaseId(): string {
  const id = process.env.NOTION_TASKS_DATABASE_ID?.trim();
  if (!id) {
    throw new Error(
      "NOTION_TASKS_DATABASE_ID is not set (required to query the Tasks database)",
    );
  }
  return normalizeNotionTasksId(id);
}
