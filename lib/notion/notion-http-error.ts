import { isHTTPResponseError } from "@notionhq/client";

/** Comment read or block read denied (integration capability / permissions). */
export function isNotionForbiddenError(error: unknown): boolean {
  return isHTTPResponseError(error) && error.status === 403;
}

export function notionErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
