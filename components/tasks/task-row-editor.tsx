"use client";

import { updateTaskProperty } from "@/app/dashboard/actions";
import {
  cachedPropertyToPlainValue,
  dateStartForInput,
  formatCachedPropertyPreview,
  getCachedPropertyType,
  getPropertyItemId,
  mergeMultiSelectOptionNames,
  mergeSelectOptionNames,
  mergeStatusOptionNames,
  plainDateFromInput,
} from "@/lib/notion/cached-property-display";
import {
  getTaskStatusPillStyle,
  groupStatusNamesForSelect,
} from "@/lib/notion/task-status-pill-styles";
import {
  getPortalOrderedPropertyKeys,
  shouldShowPropertyEditor,
} from "@/lib/notion/portal-task-properties";
import { TaskStatusPill } from "@/components/tasks/task-status-pill";
import { InlineFieldError } from "@/components/ui/InlineFieldError";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type CachedTaskRow = {
  notion_page_id: string;
  properties: Record<string, unknown>;
  last_synced_at: string;
};

type TaskRowEditorProps = {
  task: CachedTaskRow;
  /** Used for Klant read-only hint (matches `NOTION_KLANTV2_PROPERTY`). */
  klantV2PropertyName: string;
  propertyOptionsById: Record<string, string[]>;
};

function formatNlShort(iso: string) {
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TaskRowEditor({
  task,
  klantV2PropertyName,
  propertyOptionsById,
}: TaskRowEditorProps) {
  const router = useRouter();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const keys = getPortalOrderedPropertyKeys(task.properties);

  async function saveField(propertyName: string, plainValue: unknown) {
    setSavingKey(propertyName);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[propertyName];
      return next;
    });
    try {
      const r = await updateTaskProperty(
        task.notion_page_id,
        propertyName,
        plainValue,
      );
      if (!r.ok) {
        setFieldErrors((prev) => ({ ...prev, [propertyName]: r.error }));
        return;
      }
      router.refresh();
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <article className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-4 py-3 md:px-5">
        <p className="text-xs text-content/55">
          Laatst gesynchroniseerd: {formatNlShort(task.last_synced_at)}
        </p>
      </div>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2 md:gap-6 md:px-5 md:py-5">
        {keys.map((propKey) => (
          <PropertyField
            key={`${propKey}-${task.last_synced_at}`}
            properties={task.properties}
            propKey={propKey}
            snapshot={task.properties[propKey]}
            klantV2PropertyName={klantV2PropertyName}
            propertyOptionsById={propertyOptionsById}
            syncToken={task.last_synced_at}
            saving={savingKey === propKey}
            error={fieldErrors[propKey] ?? null}
            onSave={saveField}
          />
        ))}
      </div>
    </article>
  );
}

type PropertyFieldProps = {
  properties: Record<string, unknown>;
  propKey: string;
  snapshot: unknown;
  klantV2PropertyName: string;
  propertyOptionsById: Record<string, string[]>;
  syncToken: string;
  saving: boolean;
  error: string | null;
  onSave: (propertyName: string, plainValue: unknown) => void | Promise<void>;
};

function PropertyField({
  properties,
  propKey,
  snapshot,
  klantV2PropertyName,
  propertyOptionsById,
  syncToken,
  saving,
  error,
  onSave,
}: PropertyFieldProps) {
  const label = propKey.trim();
  const type = getCachedPropertyType(snapshot);
  const allowEdit = shouldShowPropertyEditor(
    properties,
    propKey,
    snapshot,
  );

  if (!allowEdit) {
    const klant = isKlantHint(propKey, klantV2PropertyName);
    const hint = klant
      ? "Toegewezen via Klant — beheer in Notion."
      : "Alleen in Notion te wijzigen.";
    const preview =
      type === "status" ? (
        <TaskStatusPill
          name={String(cachedPropertyToPlainValue(snapshot) ?? "")}
        />
      ) : (
        <span className="whitespace-pre-wrap break-words text-sm text-content/85">
          {formatCachedPropertyPreview(snapshot)}
        </span>
      );
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-content/45">
          {label}
        </p>
        <div className="mt-1.5">{preview}</div>
        <p className="mt-1 text-xs text-content/50">{hint}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <label className="text-xs font-medium uppercase tracking-wide text-content/45">
        {label}
      </label>
      <div className="mt-1.5">
        <EditableControl
          key={`${propKey}-${syncToken}`}
          propKey={propKey}
          snapshot={snapshot}
          type={type ?? ""}
          propertyOptionsById={propertyOptionsById}
          saving={saving}
          onSave={onSave}
        />
      </div>
      <InlineFieldError message={error} />
    </div>
  );
}

function isKlantHint(propKey: string, klant: string) {
  return propKey.trim().toLowerCase() === klant.trim().toLowerCase();
}

type EditableControlProps = {
  propKey: string;
  snapshot: unknown;
  type: string;
  propertyOptionsById: Record<string, string[]>;
  saving: boolean;
  onSave: (propertyName: string, plainValue: unknown) => void | Promise<void>;
};

function EditableControl({
  propKey,
  snapshot,
  type,
  propertyOptionsById,
  saving,
  onSave,
}: EditableControlProps) {
  const initial = cachedPropertyToPlainValue(snapshot);

  const [textDraft, setTextDraft] = useState(() =>
    typeof initial === "string" ? initial : String(initial ?? ""),
  );
  const [numDraft, setNumDraft] = useState(
    () =>
      typeof initial === "number"
        ? String(initial)
        : initial === "" || initial === null
          ? ""
          : String(initial ?? ""),
  );
  const [dateDraft, setDateDraft] = useState(() => dateStartForInput(snapshot));

  const btnClass =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-border bg-field px-3 text-sm font-medium text-content hover:bg-content/[0.07] disabled:opacity-50";

  if (type === "checkbox") {
    const checked = Boolean(initial);
    return (
      <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="size-4 rounded border-content/25"
          checked={checked}
          disabled={saving}
          onChange={(e) => void onSave(propKey, e.target.checked)}
        />
        {saving ? <Spinner className="size-4" /> : null}
      </label>
    );
  }

  if (type === "select") {
    const propId = getPropertyItemId(snapshot);
    const schemaNames = propId ? propertyOptionsById[propId] : undefined;
    const names = mergeSelectOptionNames(schemaNames, snapshot);
    const val = typeof initial === "string" ? initial : "";
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="min-h-[44px] w-full max-w-md rounded-md border border-border bg-field px-3 text-sm text-content shadow-sm"
          value={val}
          disabled={saving}
          onChange={(e) =>
            void onSave(propKey, e.target.value === "" ? null : e.target.value)
          }
        >
          <option value="">—</option>
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {saving ? <Spinner className="size-4" /> : null}
      </div>
    );
  }

  if (type === "status") {
    const propId = getPropertyItemId(snapshot);
    const schemaNames = propId ? propertyOptionsById[propId] : undefined;
    const names = mergeStatusOptionNames(schemaNames, snapshot);
    const val = typeof initial === "string" ? initial : "";
    const groups = groupStatusNamesForSelect(names);
    const chip = val
      ? getTaskStatusPillStyle(val).chip
      : "border-border bg-field text-content";
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={`min-h-[44px] w-full max-w-md rounded-md border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 ${chip}`}
          value={val}
          disabled={saving}
          onChange={(e) =>
            void onSave(propKey, e.target.value === "" ? null : e.target.value)
          }
        >
          <option value="">—</option>
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {saving ? <Spinner className="size-4" /> : null}
      </div>
    );
  }

  if (type === "multi_select") {
    const propId = getPropertyItemId(snapshot);
    const schemaNames = propId ? propertyOptionsById[propId] : undefined;
    const union = mergeMultiSelectOptionNames(schemaNames, snapshot);
    const selected = Array.isArray(initial)
      ? new Set(initial as string[])
      : new Set<string>();
    return (
      <ul className="space-y-2">
        {union.map((name) => {
          const on = selected.has(name);
          return (
            <li key={name}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-content">
                <input
                  type="checkbox"
                  className="size-4 rounded border-content/25"
                  checked={on}
                  disabled={saving}
                  onChange={() => {
                    const next = new Set(selected);
                    if (on) next.delete(name);
                    else next.add(name);
                    void onSave(propKey, [...next]);
                  }}
                />
                <span>{name}</span>
              </label>
            </li>
          );
        })}
        {union.length === 0 ? (
          <p className="text-sm text-content/60">Geen waarden.</p>
        ) : null}
        {saving ? <Spinner className="size-4" /> : null}
      </ul>
    );
  }

  if (type === "number") {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="number"
          className="min-h-[44px] w-full max-w-md rounded-md border border-border bg-field px-3 text-sm text-content shadow-sm"
          value={numDraft}
          disabled={saving}
          onChange={(e) => setNumDraft(e.target.value)}
        />
        <button
          type="button"
          className={btnClass}
          disabled={saving}
          onClick={() => {
            const t = numDraft.trim();
            if (t === "") void onSave(propKey, null);
            else {
              const n = Number(t);
              if (Number.isNaN(n)) return;
              void onSave(propKey, n);
            }
          }}
        >
          {saving ? <Spinner className="size-4" /> : null}
          Opslaan
        </button>
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="date"
          className="min-h-[44px] w-full max-w-md rounded-md border border-border bg-field px-3 text-sm text-content shadow-sm"
          value={dateDraft}
          disabled={saving}
          onChange={(e) => setDateDraft(e.target.value)}
        />
        <button
          type="button"
          className={btnClass}
          disabled={saving}
          onClick={() => {
            const t = dateDraft.trim();
            if (!t) void onSave(propKey, null);
            else void onSave(propKey, plainDateFromInput(t));
          }}
        >
          {saving ? <Spinner className="size-4" /> : null}
          Opslaan
        </button>
      </div>
    );
  }

  if (type === "url" || type === "email" || type === "phone_number") {
    const inputType = type === "email" ? "email" : type === "url" ? "url" : "tel";
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input
          type={inputType}
          className="min-h-[44px] w-full flex-1 rounded-md border border-border bg-field px-3 text-sm text-content shadow-sm"
          value={textDraft}
          disabled={saving}
          onChange={(e) => setTextDraft(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className={btnClass}
          disabled={saving}
          onClick={() => void onSave(propKey, textDraft)}
        >
          {saving ? <Spinner className="size-4" /> : null}
          Opslaan
        </button>
      </div>
    );
  }

  // title, rich_text
  return (
    <div className="space-y-2">
      <textarea
        className="min-h-[88px] w-full rounded-md border border-border bg-field px-3 py-2 text-sm text-content shadow-sm"
        value={textDraft}
        disabled={saving}
        onChange={(e) => setTextDraft(e.target.value)}
        rows={type === "title" ? 2 : 4}
      />
      <button
        type="button"
        className={btnClass}
        disabled={saving}
        onClick={() => void onSave(propKey, textDraft)}
      >
        {saving ? <Spinner className="size-4" /> : null}
        Opslaan
      </button>
    </div>
  );
}
