import type { FetchTaskPageCommentsResult } from "@/lib/notion/fetch-task-page-comments";

function formatNlDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type TaskPageCommentsSectionProps = {
  /** `null` when Notion fetch was skipped (not configured / blocked UI). */
  result: FetchTaskPageCommentsResult | null;
};

export function TaskPageCommentsSection({ result }: TaskPageCommentsSectionProps) {
  if (result === null) return null;

  if (!result.ok) {
    const detail =
      result.error === "forbidden"
        ? "Reacties zijn niet beschikbaar voor deze integratie. Schakel leesrechten voor reacties in bij de Notion-integratie."
        : (result.message ?? "Reacties konden niet worden geladen.");
    return (
      <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
        <h2 className="text-sm font-semibold tracking-tight text-task-ink">
          Reacties
        </h2>
        <p className="mt-2 text-sm text-task-ink/75">{detail}</p>
      </section>
    );
  }

  if (result.comments.length === 0) {
    return (
      <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
        <h2 className="text-sm font-semibold tracking-tight text-task-ink">
          Reacties
        </h2>
        <p className="mt-2 text-sm text-task-ink/65">
          Geen open reacties. Alleen niet-afgehandelde reacties uit Notion worden
          hier getoond.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
      <h2 className="text-sm font-semibold tracking-tight text-task-ink">
        Reacties
      </h2>
      <ul className="mt-3 space-y-4">
        {result.comments.map((c) => (
          <li
            key={c.id}
            className="border-b border-task-border/80 pb-4 last:border-b-0 last:pb-0"
          >
            <p className="text-xs text-task-ink/55">
              {formatNlDateTime(c.createdTime)}
              {c.authorLabel ? (
                <span className="text-task-ink/70">
                  {" "}
                  · {c.authorLabel}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-task-ink">
              {c.body || "—"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
