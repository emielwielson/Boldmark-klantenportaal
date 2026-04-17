import type { PageObjectResponse } from "@notionhq/client";

/**
 * Notion page property keys can differ from the visible column title by leading/trailing
 * spaces. Match `configuredName` (from env) to the actual key on the page.
 */
export function matchPagePropertyKey(
  properties: PageObjectResponse["properties"],
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
