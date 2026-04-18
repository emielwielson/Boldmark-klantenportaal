import type { BlockObjectResponse } from "@notionhq/client";

import { richTextToPlain } from "@/lib/notion/notion-rich-text";
import type { TaskPageDisplayBlock } from "@/lib/notion/task-page-display";

function calloutIconEmoji(
  icon: Extract<BlockObjectResponse, { type: "callout" }>["callout"]["icon"],
): string | null {
  if (!icon) return null;
  if (icon.type === "emoji") return icon.emoji ?? null;
  return null;
}

/**
 * Maps a single Notion block to a portal display row (plain text / simple structure).
 * Returns `null` to omit blocks we cannot render meaningfully (e.g. Notion buttons).
 */
export function mapNotionBlockToDisplay(
  block: BlockObjectResponse,
  depth: number,
): TaskPageDisplayBlock | null {
  if ((block as { type: string }).type === "button") {
    return null;
  }

  switch (block.type) {
    case "paragraph":
      return {
        kind: "paragraph",
        text: richTextToPlain(block.paragraph.rich_text),
        depth,
      };
    case "heading_1":
      return {
        kind: "heading",
        level: 1,
        text: richTextToPlain(block.heading_1.rich_text),
        depth,
      };
    case "heading_2":
      return {
        kind: "heading",
        level: 2,
        text: richTextToPlain(block.heading_2.rich_text),
        depth,
      };
    case "heading_3":
      return {
        kind: "heading",
        level: 3,
        text: richTextToPlain(block.heading_3.rich_text),
        depth,
      };
    case "heading_4":
      return {
        kind: "heading",
        level: 4,
        text: richTextToPlain(block.heading_4.rich_text),
        depth,
      };
    case "bulleted_list_item":
      return {
        kind: "bulleted",
        text: richTextToPlain(block.bulleted_list_item.rich_text),
        depth,
      };
    case "numbered_list_item":
      return {
        kind: "numbered",
        text: richTextToPlain(block.numbered_list_item.rich_text),
        depth,
      };
    case "to_do":
      return {
        kind: "todo",
        text: richTextToPlain(block.to_do.rich_text),
        checked: block.to_do.checked,
        depth,
      };
    case "quote":
      return {
        kind: "quote",
        text: richTextToPlain(block.quote.rich_text),
        depth,
      };
    case "callout":
      return {
        kind: "callout",
        text: richTextToPlain(block.callout.rich_text),
        iconEmoji: calloutIconEmoji(block.callout.icon),
        depth,
      };
    case "divider":
      return { kind: "divider", depth };
    case "code":
      return {
        kind: "code",
        text: richTextToPlain(block.code.rich_text),
        language: block.code.language,
        depth,
      };
    case "toggle":
      return {
        kind: "toggle",
        text: richTextToPlain(block.toggle.rich_text),
        depth,
      };
    case "template":
      return {
        kind: "paragraph",
        text: richTextToPlain(block.template.rich_text),
        depth,
      };
    case "child_page":
      return { kind: "unsupported", notionType: "child_page", depth };
    case "child_database":
      return { kind: "unsupported", notionType: "child_database", depth };
    case "unsupported":
      if (block.unsupported.block_type === "button") {
        return null;
      }
      return {
        kind: "unsupported",
        notionType: block.unsupported.block_type,
        depth,
      };
    default:
      return { kind: "unsupported", notionType: block.type, depth };
  }
}
