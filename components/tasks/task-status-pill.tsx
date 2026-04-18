"use client";

import { getTaskStatusPillStyle } from "@/lib/notion/task-status-pill-styles";

export function TaskStatusPill({ name }: { name: string }) {
  const t = name.trim();
  if (!t) {
    return <span className="text-sm text-ink/50">—</span>;
  }
  const { dot, chip } = getTaskStatusPillStyle(t);
  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${chip}`}
    >
      <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="min-w-0 truncate">{t}</span>
    </span>
  );
}

type TaskStatusPillPickerProps = {
  names: string[];
  value: string;
  saving: boolean;
  onSelect: (value: string | null) => void;
};

export function TaskStatusPillPicker({
  names,
  value,
  saving,
  onSelect,
}: TaskStatusPillPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={saving}
        onClick={() => onSelect(null)}
        className={`inline-flex min-h-[40px] items-center rounded-full border px-3 text-sm font-medium transition ${
          value === ""
            ? "border-black/25 bg-white text-ink shadow-sm"
            : "border-black/[0.08] bg-page text-ink/60 hover:bg-black/[0.03]"
        }`}
      >
        —
      </button>
      {names.map((name) => {
        const { dot, chip } = getTaskStatusPillStyle(name);
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            disabled={saving}
            onClick={() => onSelect(name)}
            className={`inline-flex max-w-full min-h-[40px] min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-left text-sm font-medium transition ${chip} ${
              selected
                ? "ring-2 ring-black/20 ring-offset-2 ring-offset-white"
                : "opacity-95 hover:opacity-100"
            }`}
          >
            <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
            <span className="min-w-0 truncate">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
