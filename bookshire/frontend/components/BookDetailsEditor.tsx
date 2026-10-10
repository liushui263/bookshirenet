"use client";

import { useState } from "react";
import type { UserBook, UserBookPatch } from "@/lib/api";
import { updateMyBook } from "@/lib/api";

export const CONDITION_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Like new",
};

type BookDetailsEditorProps = {
  item: UserBook;
  onSaved: (item: UserBook) => void;
  onCancel: () => void;
};

function splitTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,;，；]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

export function BookDetailsEditor({ item, onSaved, onCancel }: BookDetailsEditorProps) {
  const [condition, setCondition] = useState(item.condition ? String(item.condition) : "");
  const [visibility, setVisibility] = useState(item.visibility === "public" ? "public" : "private");
  const [exchangeable, setExchangeable] = useState(item.exchangeable);
  const [location, setLocation] = useState(item.location_text ?? "");
  const [tags, setTags] = useState(item.personal_tags.join(", "));
  const [notes, setNotes] = useState(item.personal_notes_summary ?? "");
  const [startedAt, setStartedAt] = useState(item.started_at ?? "");
  const [finishedAt, setFinishedAt] = useState(item.finished_at ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (startedAt && finishedAt && startedAt > finishedAt) {
      setError("The start date can't be after the finish date.");
      return;
    }

    const patch: UserBookPatch = {
      condition: condition ? Number(condition) : null,
      visibility,
      exchangeable,
      location_text: location.trim() || null,
      personal_tags: splitTags(tags),
      personal_notes_summary: notes.trim() || null,
      started_at: startedAt || null,
      finished_at: finishedAt || null,
    };

    setBusy(true);
    setError(null);
    try {
      onSaved(await updateMyBook(item.id, patch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";
  const label = "block text-sm font-semibold text-gray-900";

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
      <label className={label}>
        Condition
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={field}>
          <option value="">Not set</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {CONDITION_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className={label}>
        Who can see it
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={field}>
          <option value="private">Only me</option>
          <option value="public">Everyone</option>
        </select>
      </label>

      <label className={`${label} sm:col-span-2`}>
        Where it is
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Living room shelf, lent to Wei"
          maxLength={300}
          className={field}
        />
      </label>

      <label className={`${label} sm:col-span-2`}>
        Tags
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Separate with commas"
          className={field}
        />
      </label>

      <label className={`${label} sm:col-span-2`}>
        Private notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={5000}
          className={field}
        />
      </label>

      <label className={label}>
        Started
        <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={field} />
      </label>

      <label className={label}>
        Finished
        <input type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} className={field} />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:col-span-2">
        <input type="checkbox" checked={exchangeable} onChange={(e) => setExchangeable(e.target.checked)} />
        Open to swapping or lending this copy
      </label>

      {error && (
        <p className="text-sm text-red-700 sm:col-span-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
