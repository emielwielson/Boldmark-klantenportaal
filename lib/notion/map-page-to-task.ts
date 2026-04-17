import type { PageObjectResponse } from "@notionhq/client";

import type { Task } from "@/types/notion-task";

import { getKlantV2PropertyName } from "@/lib/notion/config";

function richTextPlain(rich: Array<{ plain_text?: string }>): string {
  return rich
    .map((t) => t.plain_text ?? "")
    .join("")
    .trim();
}

function titleFromPage(page: PageObjectResponse): string | null {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title") {
      const t = richTextPlain(prop.title);
      return t.length > 0 ? t : null;
    }
  }
  return null;
}

/**
 * KlantV2 People values are `{ type: "people", people: UserObjectResponse[] | … }`.
 * Each person user has `id` (UUID string). Notion “groups” use `object: "group"` and are
 * not matched against `user_person_scope` (workspace user ids only).
 */
export function extractKlantV2PersonIds(
  page: PageObjectResponse,
  klantV2PropertyName: string,
): string[] {
  const prop = page.properties[klantV2PropertyName];
  if (!prop || prop.type !== "people") {
    return [];
  }
  return prop.people
    .filter(
      (p): p is { id: string; object: "user" } =>
        p.object === "user" && typeof p.id === "string",
    )
    .map((p) => p.id);
}

/**
 * Produces a JSON-safe plain object for properties (drops functions / symbols).
 */
function propertiesToJson(
  props: PageObjectResponse["properties"],
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(props)) as Record<string, unknown>;
}

/**
 * Single mapping module for Notion → `Task` (FR-11, FR-27).
 */
export function mapPageToTask(
  page: PageObjectResponse,
  klantV2PropertyName: string = getKlantV2PropertyName(),
): Task {
  return {
    notion_page_id: page.id,
    url: page.url,
    last_edited_time: page.last_edited_time,
    title: titleFromPage(page),
    klant_v2_person_ids: extractKlantV2PersonIds(page, klantV2PropertyName),
    properties: propertiesToJson(page.properties),
  };
}
