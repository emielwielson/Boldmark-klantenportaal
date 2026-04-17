/**
 * Normalized task row for UI and `notion_sync_cache` (task 5). Property names stay
 * Notion-side strings; renames are handled via `NOTION_KLANTV2_PROPERTY` and mapping (FR-27).
 */
export type Task = {
  notion_page_id: string;
  url: string;
  last_edited_time: string;
  /** Plain text from the database title property */
  title: string | null;
  /** Notion user UUIDs on the KlantV2 People property (excludes Notion “groups”) */
  klant_v2_person_ids: string[];
  /** JSON-serializable snapshot of page properties for display and cache */
  properties: Record<string, unknown>;
};
