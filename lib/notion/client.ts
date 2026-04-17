import { Client } from "@notionhq/client";

/**
 * Singleton Notion client — server-only (FR-11, FR-20).
 * Do not import this module from client components or shared code used by the browser bundle.
 */

let notionClient: Client | null = null;

export function getNotionClient(): Client {
  const token = process.env.NOTION_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "NOTION_TOKEN is not set (Notion integration is disabled or misconfigured)",
    );
  }
  if (!notionClient) {
    notionClient = new Client({ auth: token });
  }
  return notionClient;
}
