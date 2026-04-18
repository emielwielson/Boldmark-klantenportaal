import type { FetchTaskPageBodyResult } from "@/lib/notion/fetch-task-page-block-tree";
import type { TaskPageDisplayBlock } from "@/lib/notion/task-page-display";

function BlockLine({ block }: { block: TaskPageDisplayBlock }) {
  const depthPad =
    block.depth > 0
      ? { paddingLeft: `${Math.min(block.depth, 12) * 0.75}rem` }
      : undefined;

  switch (block.kind) {
    case "paragraph":
      return (
        <p
          className="whitespace-pre-wrap text-sm text-task-ink"
          style={depthPad}
        >
          {block.text || "\u00a0"}
        </p>
      );
    case "heading": {
      const Tag = (
        block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5"
      ) as "h3" | "h4" | "h5";
      const size =
        block.level === 1
          ? "text-lg"
          : block.level === 2
            ? "text-base"
            : "text-sm";
      return (
        <Tag
          className={`font-semibold text-task-ink ${size}`}
          style={depthPad}
        >
          {block.text || "—"}
        </Tag>
      );
    }
    case "bulleted":
      return (
        <p className="text-sm text-task-ink" style={depthPad}>
          <span className="mr-2 text-task-ink/55">•</span>
          {block.text || "—"}
        </p>
      );
    case "numbered":
      return (
        <p className="text-sm text-task-ink" style={depthPad}>
          {block.text || "—"}
        </p>
      );
    case "todo":
      return (
        <p className="text-sm text-task-ink" style={depthPad}>
          <span className="mr-2">{block.checked ? "☑" : "☐"}</span>
          {block.text || "—"}
        </p>
      );
    case "quote":
      return (
        <blockquote
          className="border-l-2 border-task-ink/25 pl-3 text-sm italic text-task-ink/90"
          style={depthPad}
        >
          {block.text || "—"}
        </blockquote>
      );
    case "callout":
      return (
        <div
          className="rounded-md border border-task-border bg-task-field/60 px-3 py-2 text-sm text-task-ink"
          style={depthPad}
        >
          {block.text || "—"}
        </div>
      );
    case "divider":
      return (
        <hr
          className="border-task-border"
          style={depthPad}
        />
      );
    case "code":
      return (
        <pre
          className="overflow-x-auto rounded-md border border-task-border bg-task-field px-3 py-2 font-mono text-xs text-task-ink"
          style={depthPad}
        >
          {block.language ? (
            <span className="mb-1 block text-[10px] uppercase text-task-ink/50">
              {block.language}
            </span>
          ) : null}
          {block.text || ""}
        </pre>
      );
    case "toggle":
      return (
        <p className="text-sm text-task-ink" style={depthPad}>
          <span className="mr-1 text-task-ink/55">▸</span>
          {block.text || "—"}
        </p>
      );
    case "unsupported":
      return (
        <p
          className="text-xs text-task-ink/50"
          style={depthPad}
        >
          [{block.notionType}]
        </p>
      );
    default:
      return null;
  }
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
      <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
        <h2 className="text-sm font-semibold tracking-tight text-task-ink">
          Pagina-inhoud
        </h2>
        <p className="mt-2 text-sm text-task-ink/75">{detail}</p>
      </section>
    );
  }

  const { blocks, truncated } = result;

  if (blocks.length === 0) {
    return (
      <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
        <h2 className="text-sm font-semibold tracking-tight text-task-ink">
          Pagina-inhoud
        </h2>
        <p className="mt-2 text-sm text-task-ink/65">
          Deze taak heeft geen inhoudsblokken onder de titel in Notion.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-task-border bg-task-pane px-4 py-4 text-task-ink shadow-sm md:px-5 md:py-5">
      <h2 className="text-sm font-semibold tracking-tight text-task-ink">
        Pagina-inhoud
      </h2>
      {truncated ? (
        <p className="mt-1 text-xs text-task-ink/55">
          Alleen het begin van de pagina wordt getoond (limiet bereikt).
        </p>
      ) : null}
      <div className="mt-3 space-y-3">
        {blocks.map((b, i) => (
          <BlockLine
            key={`${b.kind}-${b.depth}-${i}`}
            block={b}
          />
        ))}
      </div>
    </section>
  );
}
