import type { RichTextItemResponse } from "@notionhq/client";

/**
 * Plain text from Notion `rich_text` arrays (comments, blocks, etc.).
 */
export function richTextToPlain(
  rich: Array<RichTextItemResponse> | undefined,
): string {
  if (!rich?.length) return "";
  return rich.map((t) => t.plain_text ?? "").join("").trim();
}
