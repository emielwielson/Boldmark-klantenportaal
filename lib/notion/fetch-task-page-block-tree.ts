import type {
  BlockObjectResponse,
  Client,
  PartialBlockObjectResponse,
} from "@notionhq/client";

import { mapNotionBlockToDisplay } from "@/lib/notion/notion-block-to-display";
import { isNotionForbiddenError, notionErrorMessage } from "@/lib/notion/notion-http-error";
import type { TaskPageDisplayBlock } from "@/lib/notion/task-page-display";

/** Avoid runaway API usage on very large pages. */
const MAX_BLOCKS = 500;
/** Nested block depth cap (toggle / lists / columns). */
const MAX_DEPTH = 48;

export type FetchTaskPageBodyResult =
  | { ok: true; blocks: TaskPageDisplayBlock[]; truncated: boolean }
  | { ok: false; error: "forbidden" | "other"; message?: string };

function isFullBlock(
  b: BlockObjectResponse | PartialBlockObjectResponse,
): b is BlockObjectResponse {
  return "type" in b && typeof (b as BlockObjectResponse).type === "string";
}

function shouldSkipChildTraversal(block: BlockObjectResponse): boolean {
  // Do not descend into another page / DB — would multiply API calls and scope.
  return block.type === "child_page" || block.type === "child_database";
}

/**
 * Depth-first walk of `blocks.children` starting at the page id.
 */
export async function fetchTaskPageBodyContent(
  notion: Client,
  pageId: string,
): Promise<FetchTaskPageBodyResult> {
  const blocks: TaskPageDisplayBlock[] = [];
  let truncated = false;

  async function listChildren(blockId: string): Promise<BlockObjectResponse[]> {
    const out: BlockObjectResponse[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: cursor,
      });
      for (const row of res.results) {
        if (isFullBlock(row)) out.push(row);
      }
      cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
    } while (cursor);
    return out;
  }

  async function walk(blockId: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) {
      truncated = true;
      return;
    }
    const children = await listChildren(blockId);
    for (const block of children) {
      if (blocks.length >= MAX_BLOCKS) {
        truncated = true;
        return;
      }
      blocks.push(mapNotionBlockToDisplay(block, depth));
      const skipNested =
        shouldSkipChildTraversal(block) ||
        !("has_children" in block && block.has_children);
      if (!skipNested && blocks.length < MAX_BLOCKS) {
        await walk(block.id, depth + 1);
      }
    }
  }

  try {
    await walk(pageId, 0);
    return { ok: true, blocks, truncated };
  } catch (e) {
    if (isNotionForbiddenError(e)) {
      return {
        ok: false,
        error: "forbidden",
        message: notionErrorMessage(e),
      };
    }
    return {
      ok: false,
      error: "other",
      message: notionErrorMessage(e),
    };
  }
}
