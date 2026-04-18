/**
 * Portal styling for Notion **status** names — matches Boldmark task board grouping
 * (To-do / In progress / Complete) and per-option colors.
 *
 * Matching is case-insensitive on trimmed labels; unknown labels use a neutral chip.
 */

export type TaskStatusPillStyle = {
  dot: string;
  chip: string;
};

const NEUTRAL: TaskStatusPillStyle = {
  dot: "bg-slate-400",
  chip: "bg-slate-100 text-slate-800",
};

/** To-do — blue */
const TODO_BLUE: TaskStatusPillStyle = {
  dot: "bg-[#2563eb]",
  chip: "bg-[#e8f2fc] text-[#1a365d]",
};

/** In progress — golden yellow */
const IN_PROGRESS_YELLOW: TaskStatusPillStyle = {
  dot: "bg-[#d4a012]",
  chip: "bg-[#fdf8e8] text-[#5c4510]",
};

/** In progress — soft pink / rose */
const IN_PROGRESS_ROSE: TaskStatusPillStyle = {
  dot: "bg-[#e07a8a]",
  chip: "bg-[#fceef0] text-[#5c2d34]",
};

/** In progress — terracotta / tan */
const IN_PROGRESS_ORANGE: TaskStatusPillStyle = {
  dot: "bg-[#c4713d]",
  chip: "bg-[#faf0ea] text-[#4a3426]",
};

/** Complete — green */
const COMPLETE_GREEN: TaskStatusPillStyle = {
  dot: "bg-[#2f9e5b]",
  chip: "bg-[#eaf8ef] text-[#14532d]",
};

/** Complete — cancelled grey */
const COMPLETE_GREY: TaskStatusPillStyle = {
  dot: "bg-[#6b7280]",
  chip: "bg-[#f3f4f6] text-[#1f2937]",
};

const STATUS_LOOKUP = new Map<string, TaskStatusPillStyle>([
  ["niet gestart", TODO_BLUE],
  ["aan te leveren", TODO_BLUE],
  ["bezig", IN_PROGRESS_YELLOW],
  ["na te kijken", IN_PROGRESS_YELLOW],
  ["aan het testen", IN_PROGRESS_YELLOW],
  ["nagekeken", IN_PROGRESS_ROSE],
  ["kan ingepland worden", IN_PROGRESS_ROSE],
  ["on hold", IN_PROGRESS_ORANGE],
  ["waiting input", IN_PROGRESS_ORANGE],
  ["ingepland", COMPLETE_GREEN],
  ["uitgevoerd", COMPLETE_GREEN],
  ["geannuleerd", COMPLETE_GREY],
]);

export function getTaskStatusPillStyle(statusName: string): TaskStatusPillStyle {
  const key = statusName.trim().toLowerCase();
  if (!key) return NEUTRAL;
  return STATUS_LOOKUP.get(key) ?? NEUTRAL;
}

/** Dropdown `<optgroup>` labels and option order (Boldmark board). */
const STATUS_SELECT_GROUP_ORDER: { label: string; canonicalOrder: string[] }[] =
  [
    {
      label: "To-do",
      canonicalOrder: ["niet gestart", "aan te leveren"],
    },
    {
      label: "In progress",
      canonicalOrder: [
        "bezig",
        "na te kijken",
        "aan het testen",
        "nagekeken",
        "kan ingepland worden",
        "on hold",
        "waiting input",
      ],
    },
    {
      label: "Complete",
      canonicalOrder: ["ingepland", "uitgevoerd", "geannuleerd"],
    },
  ];

export type StatusSelectGroup = { label: string; options: string[] };

/**
 * Splits Notion status option names into groups, sorted like the Boldmark reference.
 * Names that are not in the reference list are placed last under "Overig" (A–Z, nl).
 */
export function groupStatusNamesForSelect(names: string[]): StatusSelectGroup[] {
  const remaining = new Set(names);
  const out: StatusSelectGroup[] = [];

  for (const { label, canonicalOrder } of STATUS_SELECT_GROUP_ORDER) {
    const options: string[] = [];
    for (const canon of canonicalOrder) {
      const match = [...remaining].find(
        (n) => n.trim().toLowerCase() === canon,
      );
      if (match !== undefined) {
        options.push(match);
        remaining.delete(match);
      }
    }
    if (options.length > 0) {
      out.push({ label, options });
    }
  }

  if (remaining.size > 0) {
    const rest = [...remaining].sort((a, b) => a.localeCompare(b, "nl"));
    out.push({ label: "Overig", options: rest });
  }

  return out;
}
