/**
 * Helpers for reading Notion-shaped JSON from `notion_sync_cache.properties` for UI.
 * Editable types must stay aligned with `plainValueToNotionPropertyUpdate` in
 * `map-task-to-notion-properties.ts` (FR-10).
 */

type RichTextLike = { plain_text?: string };

function richTextToString(rich: RichTextLike[] | undefined): string {
  if (!rich?.length) return "";
  return rich.map((t) => t.plain_text ?? "").join("").trim();
}

/** Types supported by `plainValueToNotionPropertyUpdate` — keep in sync with that module. */
const EDITABLE_PROPERTY_TYPES = new Set([
  "title",
  "rich_text",
  "number",
  "checkbox",
  "url",
  "email",
  "phone_number",
  "select",
  "multi_select",
  "status",
  "date",
]);

export function isCachedPropertyEditable(type: string | undefined): boolean {
  return Boolean(type && EDITABLE_PROPERTY_TYPES.has(type));
}

/**
 * Match env-configured column title to actual JSON key (handles leading/trailing spaces).
 */
export function matchPropertyKey(
  properties: Record<string, unknown>,
  configuredName: string,
): string | undefined {
  if (Object.hasOwn(properties, configuredName)) {
    return configuredName;
  }
  const want = configuredName.trim().toLowerCase();
  for (const k of Object.keys(properties)) {
    if (k.trim().toLowerCase() === want) {
      return k;
    }
  }
  return undefined;
}

/** Current status name from the cached **Status** column, or empty if missing / not a status type. */
export function getStatusLabelFromProperties(
  properties: Record<string, unknown>,
  statusColumnTitle = "Status",
): string {
  const key = matchPropertyKey(properties, statusColumnTitle);
  if (!key) return "";
  const snap = properties[key];
  if (getCachedPropertyType(snap) !== "status") return "";
  return getSelectedStatusName(snap) ?? "";
}

export function notionPublicPageUrl(notionPageId: string): string {
  const id = notionPageId.replace(/-/g, "");
  return `https://www.notion.so/${id}`;
}

function getPropType(prop: unknown): string | undefined {
  if (!prop || typeof prop !== "object") return undefined;
  return (prop as { type?: string }).type;
}

export function getCachedPropertyType(prop: unknown): string | undefined {
  return getPropType(prop);
}

/** Plain-text title from whichever property has `type: "title"`. */
export function getTitleFromProperties(
  properties: Record<string, unknown>,
): string | null {
  for (const prop of Object.values(properties)) {
    if (getPropType(prop) === "title") {
      const t = (prop as { title?: RichTextLike[] }).title;
      const s = richTextToString(t);
      return s.length > 0 ? s : null;
    }
  }
  return null;
}

/** Value for controlled inputs / `updateTaskProperty` (matches `plainValueToNotionPropertyUpdate`). */
export function cachedPropertyToPlainValue(
  cached: unknown,
): string | number | boolean | string[] | { start: string; end?: string | null } | null {
  if (!cached || typeof cached !== "object") return null;
  const p = cached as Record<string, unknown>;
  const type = p.type as string | undefined;

  switch (type) {
    case "title":
      return richTextToString((p as { title?: RichTextLike[] }).title);
    case "rich_text":
      return richTextToString((p as { rich_text?: RichTextLike[] }).rich_text);
    case "number": {
      const n = (p as { number?: number | null }).number;
      return n === undefined || n === null ? "" : n;
    }
    case "checkbox":
      return Boolean((p as { checkbox?: boolean }).checkbox);
    case "url": {
      const u = (p as { url?: string | null }).url;
      return u ?? "";
    }
    case "email": {
      const e = (p as { email?: string | null }).email;
      return e ?? "";
    }
    case "phone_number": {
      const ph = (p as { phone_number?: string | null }).phone_number;
      return ph ?? "";
    }
    case "select": {
      const name = (p as { select?: { name?: string } | null }).select?.name;
      return name ?? "";
    }
    case "multi_select": {
      const ms = (p as { multi_select?: { name?: string }[] }).multi_select;
      return (ms ?? []).map((x) => x.name ?? "").filter(Boolean);
    }
    case "status": {
      const name = (p as { status?: { name?: string } | null }).status?.name;
      return name ?? "";
    }
    case "date": {
      const d = (p as { date?: { start?: string; end?: string | null } | null })
        .date;
      if (!d?.start) return "";
      return { start: d.start, end: d.end ?? null };
    }
    default:
      return "";
  }
}

/** Human-readable preview for read-only columns. */
export function formatCachedPropertyPreview(cached: unknown): string {
  if (!cached || typeof cached !== "object") return "—";
  const p = cached as Record<string, unknown>;
  const type = p.type as string | undefined;

  switch (type) {
    case "title":
      return richTextToString((p as { title?: RichTextLike[] }).title) || "—";
    case "rich_text":
      return richTextToString((p as { rich_text?: RichTextLike[] }).rich_text) || "—";
    case "number": {
      const n = (p as { number?: number | null }).number;
      return n === null || n === undefined ? "—" : String(n);
    }
    case "checkbox":
      return (p as { checkbox?: boolean }).checkbox ? "Ja" : "Nee";
    case "url": {
      const u = (p as { url?: string | null }).url;
      return u || "—";
    }
    case "email": {
      const e = (p as { email?: string | null }).email;
      return e || "—";
    }
    case "phone_number": {
      const ph = (p as { phone_number?: string | null }).phone_number;
      return ph || "—";
    }
    case "select": {
      const name = (p as { select?: { name?: string } | null }).select?.name;
      return name || "—";
    }
    case "multi_select": {
      const ms = (p as { multi_select?: { name?: string }[] }).multi_select;
      if (!ms?.length) return "—";
      return ms.map((x) => x.name).filter(Boolean).join(", ");
    }
    case "status": {
      const name = (p as { status?: { name?: string } | null }).status?.name;
      return name || "—";
    }
    case "date": {
      const d = (p as { date?: { start?: string; end?: string | null } | null })
        .date;
      if (!d?.start) return "—";
      const end = d.end ? ` → ${d.end}` : "";
      return `${d.start}${end}`;
    }
    case "people": {
      const people = (p as { people?: { name?: string; id?: string }[] }).people;
      if (!people?.length) return "—";
      return people
        .map((x) => x.name || x.id || "?")
        .filter(Boolean)
        .join(", ");
    }
    case "relation":
      return (
        (p as { relation?: { id?: string }[] }).relation
          ?.map((r) => r.id?.slice(0, 8) ?? "")
          .filter(Boolean)
          .join(", ") || "—"
      );
    case "formula":
    case "rollup":
      return "[formule / rollup — zie Notion]";
    case "files":
      return (
        (p as { files?: { name?: string }[] }).files
          ?.map((f) => f.name)
          .filter(Boolean)
          .join(", ") || "—"
      );
    default:
      return type ? `[${type}]` : "—";
  }
}

export type SelectOption = { name: string; color?: string };

export function getSelectOptions(cached: unknown): SelectOption[] {
  if (!cached || typeof cached !== "object") return [];
  const p = cached as { select?: { options?: SelectOption[] } };
  return p.select?.options ?? [];
}

export function getStatusOptions(cached: unknown): SelectOption[] {
  if (!cached || typeof cached !== "object") return [];
  const p = cached as { status?: { options?: SelectOption[] } };
  return p.status?.options ?? [];
}

export function getMultiSelectOptions(cached: unknown): SelectOption[] {
  if (!cached || typeof cached !== "object") return [];
  const p = cached as { multi_select?: { options?: SelectOption[] } };
  return p.multi_select?.options ?? [];
}

/** Notion property `id` on cached page properties (stable; used to join data source schema options). */
export function getPropertyItemId(snapshot: unknown): string | undefined {
  if (!snapshot || typeof snapshot !== "object") return undefined;
  const id = (snapshot as { id?: string }).id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function getSelectedSelectName(cached: unknown): string | undefined {
  if (!cached || typeof cached !== "object") return undefined;
  const s = (cached as { select?: { name?: string } | null }).select;
  const name = s?.name;
  return name && name.length > 0 ? name : undefined;
}

export function getSelectedStatusName(cached: unknown): string | undefined {
  if (!cached || typeof cached !== "object") return undefined;
  const s = (cached as { status?: { name?: string } | null }).status;
  const name = s?.name;
  return name && name.length > 0 ? name : undefined;
}

/**
 * Union: data source schema names (if fetched) + any names on the cached snapshot + current value.
 * Ensures `<select>` options include the selected value (page objects omit `options` on rows).
 */
export function mergeSelectOptionNames(
  schemaNames: string[] | undefined,
  snapshot: unknown,
): string[] {
  const fromSchema = schemaNames ?? [];
  const fromCache = getSelectOptions(snapshot).map((o) => o.name);
  const current = getSelectedSelectName(snapshot);
  const uniq = new Set<string>([
    ...fromSchema,
    ...fromCache,
    ...(current ? [current] : []),
  ]);
  return [...uniq].sort((a, b) => a.localeCompare(b, "nl"));
}

export function mergeStatusOptionNames(
  schemaNames: string[] | undefined,
  snapshot: unknown,
): string[] {
  const fromSchema = schemaNames ?? [];
  const fromCache = getStatusOptions(snapshot).map((o) => o.name);
  const current = getSelectedStatusName(snapshot);
  const uniq = new Set<string>([
    ...fromSchema,
    ...fromCache,
    ...(current ? [current] : []),
  ]);
  return [...uniq].sort((a, b) => a.localeCompare(b, "nl"));
}

export function mergeMultiSelectOptionNames(
  schemaNames: string[] | undefined,
  snapshot: unknown,
): string[] {
  const fromSchema = schemaNames ?? [];
  const fromCache = getMultiSelectOptions(snapshot).map((o) => o.name);
  const raw = (
    snapshot as { multi_select?: { name?: string }[] } | null
  )?.multi_select;
  const selected = (raw ?? []).map((x) => x.name).filter(Boolean) as string[];
  const uniq = new Set<string>([...fromSchema, ...fromCache, ...selected]);
  return [...uniq].sort((a, b) => a.localeCompare(b, "nl"));
}

/** `YYYY-MM-DD` for `<input type="date" />` from Notion date payload. */
export function dateStartForInput(cached: unknown): string {
  const plain = cachedPropertyToPlainValue(cached);
  if (typeof plain === "object" && plain !== null && "start" in plain) {
    const start = (plain as { start: string }).start;
    if (!start) return "";
    return start.length >= 10 ? start.slice(0, 10) : start;
  }
  if (typeof plain === "string") return plain.slice(0, 10);
  return "";
}

/** Plain object to send when saving date from date input. */
export function plainDateFromInput(isoDate: string): {
  start: string;
  end?: string | null;
} | null {
  const t = isoDate.trim();
  if (!t) return null;
  return { start: t };
}

export function isKlantV2Column(
  propertyKey: string,
  klantV2ConfiguredName: string,
): boolean {
  return propertyKey.trim().toLowerCase() === klantV2ConfiguredName.trim().toLowerCase();
}
