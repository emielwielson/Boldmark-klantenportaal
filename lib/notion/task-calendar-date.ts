import { matchPropertyKey } from "@/lib/notion/cached-property-display";

const PUBLICATIEDATUM_TITLE = "Publicatiedatum";

/**
 * Notion `date.start` → calendar day key `YYYY-MM-DD` (date-only; ignores time part).
 */
export function notionDateStartToDayKey(start: string | undefined | null): string | null {
  if (!start || typeof start !== "string") return null;
  const t = start.trim();
  if (t.length >= 10) {
    const head = t.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  }
  try {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Day key for the Publicatiedatum column, or `null` if missing / not a date.
 */
export function getPublicatiedatumDayKey(
  properties: Record<string, unknown>,
): string | null {
  const key = matchPropertyKey(properties, PUBLICATIEDATUM_TITLE);
  if (!key) return null;
  const prop = properties[key];
  if (!prop || typeof prop !== "object") return null;
  const p = prop as { type?: string; date?: { start?: string | null } | null };
  if (p.type !== "date") return null;
  const start = p.date?.start;
  if (start == null || start === "") return null;
  return notionDateStartToDayKey(start);
}

/** `monthIndex` is 0–11 (JavaScript `Date` month). */
export function isDayKeyInMonth(
  dayKey: string,
  year: number,
  monthIndex: number,
): boolean {
  const parts = dayKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false;
  const [y, m, d] = parts;
  if (m === undefined || d === undefined) return false;
  return y === year && m === monthIndex + 1;
}

export function formatDayKeyForCalendar(
  year: number,
  monthIndex: number,
  dayOfMonth: number,
): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(dayOfMonth).padStart(2, "0");
  return `${year}-${m}-${d}`;
}
