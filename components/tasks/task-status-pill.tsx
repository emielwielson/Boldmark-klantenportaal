"use client";

import { getTaskStatusPillStyle } from "@/lib/notion/task-status-pill-styles";

export function TaskStatusPill({ name }: { name: string }) {
  const t = name.trim();
  if (!t) {
    return <span className="text-sm text-content/50">—</span>;
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
