/**
 * Server-only Notion configuration (FR-20). Never import this from client components.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(label: string, value: string): void {
  if (!UUID_RE.test(value)) {
    throw new Error(`${label} must be a UUID (got: ${value.slice(0, 12)}…)`);
  }
}

/** True when Notion integration env is present enough to call the API. */
export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim());
}

/** True when Tasks database id is set (required for data source queries). */
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
 * Validates and returns the Tasks database id (NOTION_TASKS_DATABASE_ID).
 */
export function getNotionTasksDatabaseId(): string {
  const id = process.env.NOTION_TASKS_DATABASE_ID?.trim();
  if (!id) {
    throw new Error(
      "NOTION_TASKS_DATABASE_ID is not set (required to query the Tasks database)",
    );
  }
  assertUuid("NOTION_TASKS_DATABASE_ID", id);
  return id;
}
