import { getTitleFromProperties } from "@/lib/notion/cached-property-display";
import {
  TaskRowEditor,
  type CachedTaskRow,
} from "@/components/tasks/task-row-editor";

type TaskListProps = {
  tasks: CachedTaskRow[];
  klantV2PropertyName: string;
  /** Data source schema option names by Notion property id (select/status/multi_select). */
  propertyOptionsById: Record<string, string[]>;
};

function sortTasksByTitle(tasks: CachedTaskRow[]): CachedTaskRow[] {
  return [...tasks].sort((a, b) => {
    const ta =
      getTitleFromProperties(a.properties) ?? a.notion_page_id.slice(0, 8);
    const tb =
      getTitleFromProperties(b.properties) ?? b.notion_page_id.slice(0, 8);
    return ta.localeCompare(tb, "nl", { sensitivity: "base" });
  });
}

export function TaskList({
  tasks,
  klantV2PropertyName,
  propertyOptionsById,
}: TaskListProps) {
  const sorted = sortTasksByTitle(tasks);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/[0.12] bg-white/80 px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-medium text-ink">Geen taken in dit portaal</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Er zijn nog geen taken waaraan je via Klant bent gekoppeld, of ze zijn
          nog niet gesynchroniseerd. Vernieuw de pagina of neem contact op met je
          beheerder als dit onverwacht is.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
        Jouw taken ({sorted.length})
      </h2>
      <ul className="space-y-6">
        {sorted.map((task) => (
          <li
            key={`${task.notion_page_id}-${task.last_synced_at}`}
            className="list-none"
          >
            <TaskRowEditor
              task={task}
              klantV2PropertyName={klantV2PropertyName}
              propertyOptionsById={propertyOptionsById}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
