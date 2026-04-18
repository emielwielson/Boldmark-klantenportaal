import type { Client, CommentObjectResponse } from "@notionhq/client";

import type { TaskPageCommentDTO } from "@/lib/notion/task-page-display";
import { isNotionForbiddenError, notionErrorMessage } from "@/lib/notion/notion-http-error";
import { richTextToPlain } from "@/lib/notion/notion-rich-text";

export type FetchTaskPageCommentsResult =
  | { ok: true; comments: TaskPageCommentDTO[] }
  | { ok: false; error: "forbidden" | "other"; message?: string };

/**
 * Lists unresolved comments on the page (`block_id` = page id).
 * Requires comment read capability on the integration; otherwise 403.
 */
export async function fetchTaskPageComments(
  notion: Client,
  notionPageId: string,
): Promise<FetchTaskPageCommentsResult> {
  try {
    const all: CommentObjectResponse[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.comments.list({
        block_id: notionPageId,
        page_size: 100,
        start_cursor: cursor,
      });
      all.push(...res.results);
      cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
    } while (cursor);

    const comments: TaskPageCommentDTO[] = all.map((c) => ({
      id: c.id,
      body: richTextToPlain(c.rich_text),
      createdTime: c.created_time,
      authorLabel: c.display_name?.resolved_name?.trim() || null,
    }));

    comments.sort(
      (a, b) =>
        new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime(),
    );

    return { ok: true, comments };
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
