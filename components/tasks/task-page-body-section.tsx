import type { ReactNode } from "react";

import type { FetchTaskPageBodyResult } from "@/lib/notion/fetch-task-page-block-tree";
import type { TaskPageDisplayBlock } from "@/lib/notion/task-page-display";

function BlockLine({
  block,
  numberedIndex,
}: {
  block: TaskPageDisplayBlock;
  numberedIndex?: number;
}) {
  const depthPad =
    block.depth > 0
      ? { paddingLeft: `${Math.min(block.depth, 12) * 0.75}rem` }
      : undefined;

  const bodyText = "text-[0.9375rem] leading-relaxed text-task-ink";

  switch (block.kind) {
    case "paragraph":
      return (
        <p
          className={`whitespace-pre-wrap ${bodyText}`}
          style={depthPad}
        >
          {block.text || "\u00a0"}
        </p>
      );
    case "heading": {
      const size =
        block.level === 1
          ? "text-xl font-bold tracking-tight"
          : block.level === 2
            ? "text-lg font-semibold tracking-tight"
            : block.level === 3
              ? "text-base font-semibold"
              : "text-sm font-semibold";
      const Tag = (
        block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5"
      ) as "h3" | "h4" | "h5";
      return (
        <Tag
          className={`${size} text-task-ink`}
          style={depthPad}
        >
          {block.text || "—"}
        </Tag>
      );
    }
    case "bulleted":
      return (
        <div
          className={`flex gap-2.5 ${bodyText}`}
          style={depthPad}
        >
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-task-ink/45"
            aria-hidden
          />
          <span className="min-w-0 flex-1">{block.text || "—"}</span>
        </div>
      );
    case "numbered":
      return (
        <div
          className={`flex gap-2 ${bodyText}`}
          style={depthPad}
        >
          <span
            className="mt-0.5 min-w-[1.25rem] shrink-0 text-right text-[0.875rem] tabular-nums text-task-ink/50"
            aria-hidden
          >
            {numberedIndex != null ? `${numberedIndex}.` : "•"}
          </span>
          <span className="min-w-0 flex-1">{block.text || "—"}</span>
        </div>
      );
    case "todo":
      return (
        <div
          className={`flex items-start gap-2.5 ${bodyText}`}
          style={depthPad}
        >
          <span
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-task-ink/35 text-[10px] font-medium leading-none text-task-ink/70"
            aria-hidden
          >
            {block.checked ? "✓" : ""}
          </span>
          <span
            className={
              block.checked
                ? "min-w-0 flex-1 text-task-ink/55 line-through"
                : "min-w-0 flex-1"
            }
          >
            {block.text || "—"}
          </span>
        </div>
      );
    case "quote":
      return (
        <blockquote
          className="border-l-[3px] border-task-ink/20 pl-3 text-[0.9375rem] italic leading-relaxed text-task-ink/85"
          style={depthPad}
        >
          {block.text || "—"}
        </blockquote>
      );
    case "callout":
      return (
        <div
          className={`flex items-start gap-2 ${bodyText}`}
          style={depthPad}
        >
          {block.iconEmoji ? (
            <span
              className="mt-0.5 shrink-0 text-base leading-none"
              aria-hidden
            >
              {block.iconEmoji}
            </span>
          ) : null}
          <span className="min-w-0 flex-1">{block.text || "—"}</span>
        </div>
      );
    case "divider":
      return (
        <div
          className="py-1"
          style={depthPad}
        >
          <hr className="border-0 border-t border-task-border" />
        </div>
      );
    case "code":
      return (
        <pre
          className="overflow-x-auto rounded-md border border-task-border bg-task-field px-3 py-2.5 font-mono text-[0.8125rem] leading-relaxed text-task-ink"
          style={depthPad}
        >
          {block.language ? (
            <span className="mb-1.5 block text-[10px] font-sans font-medium uppercase tracking-wide text-task-ink/45">
              {block.language}
            </span>
          ) : null}
          {block.text || ""}
        </pre>
      );
    case "toggle":
      return (
        <div
          className={`flex gap-1.5 ${bodyText}`}
          style={depthPad}
        >
          <span className="mt-0.5 shrink-0 text-task-ink/45" aria-hidden>
            ▸
          </span>
          <span className="min-w-0 flex-1">{block.text || "—"}</span>
        </div>
      );
    case "unsupported":
      return (
        <p
          className="text-xs text-task-ink/45"
          style={depthPad}
        >
          [{block.notionType}]
        </p>
      );
    default:
      return null;
  }
}

/** Notion restarts numbering after a non-numbered block; approximate with running counter. */
function attachNumberedIndices(
  blocks: TaskPageDisplayBlock[],
): { block: TaskPageDisplayBlock; numberedIndex?: number }[] {
  let n = 0;
  return blocks.map((block) => {
    if (block.kind === "numbered") {
      n += 1;
      return { block, numberedIndex: n };
    }
    n = 0;
    return { block };
  });
}

function PageContentShell({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
      {meta ? (
        <p className="mb-3 text-xs text-task-ink/55">{meta}</p>
      ) : null}
      {children}
    </section>
  );
}

type TaskPageBodySectionProps = {
  result: FetchTaskPageBodyResult | null;
};

export function TaskPageBodySection({ result }: TaskPageBodySectionProps) {
  if (result === null) return null;

  if (!result.ok) {
    const detail =
      result.error === "forbidden"
        ? "Pagina-inhoud is niet beschikbaar voor deze integratie. Controleer de rechten van de Notion-integratie."
        : (result.message ?? "Inhoud kon niet worden geladen.");
    return (
      <PageContentShell>
        <p className="text-[0.9375rem] leading-relaxed text-task-ink/80">
          {detail}
        </p>
      </PageContentShell>
    );
  }

  const { blocks, truncated } = result;

  if (blocks.length === 0) {
    return (
      <PageContentShell>
        <p className="text-[0.9375rem] leading-relaxed text-task-ink/65">
          Deze taak heeft geen inhoudsblokken onder de titel in Notion.
        </p>
      </PageContentShell>
    );
  }

  const rows = attachNumberedIndices(blocks);

  return (
    <PageContentShell
      meta={
        truncated ? (
          <span>
            Alleen het begin van de pagina wordt getoond (limiet bereikt).
          </span>
        ) : undefined
      }
    >
      <div className="space-y-1.5">
        {rows.map(({ block, numberedIndex }, i) => (
          <BlockLine
            key={`${block.kind}-${block.depth}-${i}`}
            block={block}
            numberedIndex={numberedIndex}
          />
        ))}
      </div>
    </PageContentShell>
  );
}
