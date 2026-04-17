import type { UpdatePageParameters } from "@notionhq/client";

type PagePropertiesUpdate = NonNullable<UpdatePageParameters["properties"]>;
type SinglePropertyUpdate = PagePropertiesUpdate[string];

type CachedProperty = {
  type?: string;
  id?: string;
};

function textRichText(content: string) {
  return [
    {
      type: "text" as const,
      text: { content },
    },
  ];
}

/**
 * Maps a **plain** edit value to a Notion `pages.update` property payload using the
 * cached property’s `type` (from `map-page-to-task` / Notion snapshot). Last-write-wins (FR-12).
 *
 * Unsupported types (formula, rollup, …) throw so callers can surface a clear error.
 */
export function plainValueToNotionPropertyUpdate(
  cached: unknown,
  plainValue: unknown,
): SinglePropertyUpdate {
  const c = cached as CachedProperty;
  const t = c?.type;

  switch (t) {
    case "title": {
      const s =
        typeof plainValue === "string" ? plainValue : String(plainValue ?? "");
      return { title: textRichText(s), type: "title" };
    }
    case "rich_text": {
      const s =
        typeof plainValue === "string" ? plainValue : String(plainValue ?? "");
      return { rich_text: textRichText(s), type: "rich_text" };
    }
    case "number": {
      if (plainValue === null || plainValue === "") {
        return { number: null, type: "number" };
      }
      const n =
        typeof plainValue === "number" ? plainValue : Number(plainValue);
      if (Number.isNaN(n)) {
        throw new Error("Ongeldig getal.");
      }
      return { number: n, type: "number" };
    }
    case "checkbox": {
      return { checkbox: Boolean(plainValue), type: "checkbox" };
    }
    case "url": {
      const s =
        plainValue === null || plainValue === undefined
          ? null
          : String(plainValue);
      return { url: s, type: "url" };
    }
    case "email": {
      const s =
        plainValue === null || plainValue === undefined
          ? null
          : String(plainValue);
      return { email: s, type: "email" };
    }
    case "phone_number": {
      const s =
        plainValue === null || plainValue === undefined
          ? null
          : String(plainValue);
      return { phone_number: s, type: "phone_number" };
    }
    case "select": {
      if (plainValue === null || plainValue === "") {
        return { select: null, type: "select" };
      }
      return {
        select: { name: String(plainValue) },
        type: "select",
      };
    }
    case "multi_select": {
      const names = Array.isArray(plainValue)
        ? plainValue.map(String)
        : [String(plainValue ?? "")];
      return {
        multi_select: names.filter(Boolean).map((name) => ({ name })),
        type: "multi_select",
      };
    }
    case "status": {
      if (plainValue === null || plainValue === "") {
        return { status: null, type: "status" };
      }
      return {
        status: { name: String(plainValue) },
        type: "status",
      };
    }
    case "date": {
      if (plainValue === null || plainValue === "") {
        return { date: null, type: "date" };
      }
      if (
        typeof plainValue === "object" &&
        plainValue !== null &&
        "start" in (plainValue as object)
      ) {
        return {
          date: plainValue as { start: string; end?: string | null },
          type: "date",
        };
      }
      return {
        date: { start: String(plainValue) },
        type: "date",
      };
    }
    default:
      throw new Error(
        `Eigenschapstype wordt nog niet ondersteund voor bewerken: ${t ?? "onbekend"}`,
      );
  }
}
