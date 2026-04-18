"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getStatusLabelFromProperties,
  getTitleFromProperties,
} from "@/lib/notion/cached-property-display";
import {
  formatDayKeyForCalendar,
  getPublicatiedatumDayKey,
} from "@/lib/notion/task-calendar-date";
import { getTaskStatusSurfaceClass } from "@/lib/notion/task-status-pill-styles";

import type { CachedTaskRow } from "./task-row-editor";

const WEEKDAYS_SHORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

/** Saturday / Sunday in local time (calendar grid is Monday-first). */
function isWeekendDay(year: number, monthIndex: number, day: number): boolean {
  const dow = new Date(year, monthIndex, day).getDay();
  return dow === 0 || dow === 6;
}

const weekendHeaderCell =
  "bg-stone-50/90 text-ink/55";
const weekdayHeaderCell = "bg-page text-ink/55";
const weekendDayCell = "bg-stone-50/80";
const weekdayDayCell = "bg-white";

function monthTitleNl(year: number, monthIndex: number): string {
  const raw = new Intl.DateTimeFormat("nl-NL", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

type ViewState = { y: number; m: number };

export function DashboardCalendarShell({ tasks }: { tasks: CachedTaskRow[] }) {
  const [view, setView] = useState<ViewState>(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const { byDay, undated } = useMemo(() => {
    const map = new Map<string, CachedTaskRow[]>();
    const noDate: CachedTaskRow[] = [];
    for (const t of tasks) {
      const k = getPublicatiedatumDayKey(t.properties);
      if (!k) {
        noDate.push(t);
        continue;
      }
      const list = map.get(k) ?? [];
      list.push(t);
      map.set(k, list);
    }
    return { byDay: map, undated: noDate };
  }, [tasks]);

  const gridCells = useMemo(() => {
    const { y, m } = view;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDow = new Date(y, m, 1).getDay();
    const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;

    type Cell =
      | { kind: "empty" }
      | { kind: "day"; day: number; dayKey: string; dayTasks: CachedTaskRow[] };

    const cells: Cell[] = [];
    for (let i = 0; i < mondayOffset; i++) {
      cells.push({ kind: "empty" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = formatDayKeyForCalendar(y, m, d);
      cells.push({
        kind: "day",
        day: d,
        dayKey,
        dayTasks: byDay.get(dayKey) ?? [],
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ kind: "empty" });
    }
    return cells;
  }, [view, byDay]);

  if (tasks.length === 0) {
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Kalender (publicatiedatum)
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-[40px] rounded-md border border-black/[0.1] bg-page px-3 text-sm font-medium text-ink hover:bg-black/[0.03]"
            onClick={() => {
              const d = new Date();
              setView({ y: d.getFullYear(), m: d.getMonth() });
            }}
          >
            Vandaag
          </button>
          <button
            type="button"
            className="min-h-[40px] rounded-md border border-black/[0.1] bg-page px-3 text-sm font-medium text-ink hover:bg-black/[0.03]"
            onClick={() =>
              setView((v) =>
                v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 },
              )
            }
          >
            ← Vorige
          </button>
          <p className="min-w-[10rem] text-center text-sm font-semibold text-ink">
            {monthTitleNl(view.y, view.m)}
          </p>
          <button
            type="button"
            className="min-h-[40px] rounded-md border border-black/[0.1] bg-page px-3 text-sm font-medium text-ink hover:bg-black/[0.03]"
            onClick={() =>
              setView((v) =>
                v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 },
              )
            }
          >
            Volgende →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/[0.06] bg-white shadow-sm">
        <div className="grid min-w-[720px] grid-cols-7 gap-px bg-black/[0.06] p-px">
          {WEEKDAYS_SHORT.map((w, i) => (
            <div
              key={w}
              className={`px-1 py-2 text-center text-xs font-medium uppercase tracking-wide ${
                i >= 5 ? weekendHeaderCell : weekdayHeaderCell
              }`}
            >
              {w}
            </div>
          ))}
          {gridCells.map((cell, idx) => {
            if (cell.kind === "empty") {
              return (
                <div
                  key={`e-${idx}`}
                  className="min-h-[88px] bg-page/50 p-1"
                />
              );
            }
            const { day, dayKey, dayTasks } = cell;
            const weekend = isWeekendDay(view.y, view.m, day);
            return (
              <div
                key={dayKey}
                className={`flex min-h-[88px] flex-col gap-1 p-1 ${
                  weekend ? weekendDayCell : weekdayDayCell
                }`}
              >
                <span className="text-xs font-medium text-ink/70">{day}</span>
                <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                  {dayTasks.map((t) => {
                    const title =
                      getTitleFromProperties(t.properties) ??
                      t.notion_page_id.slice(0, 8);
                    const statusLabel = getStatusLabelFromProperties(
                      t.properties,
                    );
                    const surface = getTaskStatusSurfaceClass(statusLabel);
                    return (
                      <li key={t.notion_page_id} className="min-w-0">
                        <Link
                          href={`/dashboard/task/${t.notion_page_id}`}
                          className={`block truncate rounded-md px-1.5 py-1 text-xs font-medium text-ink underline-offset-2 hover:underline hover:ring-1 hover:ring-black/10 ${surface}`}
                          title={title}
                        >
                          {title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink/80">
            Zonder publicatiedatum ({undated.length})
          </h3>
          <ul className="space-y-2 rounded-lg border border-black/[0.06] bg-white p-4 shadow-sm">
            {undated.map((t) => {
              const title =
                getTitleFromProperties(t.properties) ??
                t.notion_page_id.slice(0, 8);
              const statusLabel = getStatusLabelFromProperties(t.properties);
              const surface = getTaskStatusSurfaceClass(statusLabel);
              return (
                <li key={t.notion_page_id}>
                  <Link
                    href={`/dashboard/task/${t.notion_page_id}`}
                    className={`block rounded-md px-2 py-1.5 text-sm font-medium text-ink underline-offset-2 hover:underline hover:ring-1 hover:ring-black/10 ${surface}`}
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
