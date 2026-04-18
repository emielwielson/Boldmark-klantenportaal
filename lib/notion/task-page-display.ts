/**
 * Serializable display models for Notion page body + comments (task detail UI).
 */

export type TaskPageDisplayBlock =
  | { kind: "paragraph"; text: string; depth: number }
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string; depth: number }
  | { kind: "bulleted"; text: string; depth: number }
  | { kind: "numbered"; text: string; depth: number }
  | { kind: "todo"; text: string; checked: boolean; depth: number }
  | { kind: "quote"; text: string; depth: number }
  | { kind: "callout"; text: string; depth: number }
  | { kind: "divider"; depth: number }
  | { kind: "code"; text: string; language?: string; depth: number }
  | { kind: "toggle"; text: string; depth: number }
  | { kind: "unsupported"; notionType: string; depth: number };

export type TaskPageCommentDTO = {
  id: string;
  body: string;
  createdTime: string;
  /** From `display_name.resolved_name` or fallback */
  authorLabel: string | null;
};
