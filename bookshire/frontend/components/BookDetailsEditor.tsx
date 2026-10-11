"use client";

import { useState } from "react";
import type { UserBook, UserBookPatch } from "@/lib/api";
import { updateMyBook } from "@/lib/api";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/components/LocaleProvider";

export function conditionLabels(tr: Translate): Record<number, string> {
  return {
    1: tr("Poor", "较差"),
    2: tr("Fair", "一般"),
    3: tr("Good", "良好"),
    4: tr("Very good", "很好"),
    5: tr("Like new", "几乎全新"),
  };
}

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
  const tr = useT();
  const conditions = conditionLabels(tr);
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
      setError(tr("The start date can't be after the finish date.", "开始日期不能晚于读完日期。"));
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
      setError(err instanceof Error ? err.message : tr("Could not save.", "保存失败。"));
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";
  const label = "block text-sm font-semibold text-gray-900";

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
      <label className={label}>
        {tr("Condition", "品相")}
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={field}>
          <option value="">{tr("Not set", "未设置")}</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {conditions[value]}
            </option>
          ))}
        </select>
      </label>

      <label className={label}>
        {tr("Who can see it", "谁能看到")}
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={field}>
          <option value="private">{tr("Only me", "仅自己")}</option>
          <option value="public">{tr("Everyone", "所有人")}</option>
        </select>
      </label>

      <label className={`${label} sm:col-span-2`}>
        {tr("Where it is", "存放位置")}
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={tr("e.g. Living room shelf, lent to Wei", "例如：客厅书架、借给了小魏")}
          maxLength={300}
          className={field}
        />
      </label>

      <label className={`${label} sm:col-span-2`}>
        {tr("Tags", "标签")}
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={tr("Separate with commas", "用逗号分隔")}
          className={field}
        />
      </label>

      <label className={`${label} sm:col-span-2`}>
        {tr("Private notes", "私人笔记")}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={5000}
          className={field}
        />
      </label>

      <label className={label}>
        {tr("Started", "开始阅读")}
        <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={field} />
      </label>

      <label className={label}>
        {tr("Finished", "读完")}
        <input type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} className={field} />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:col-span-2">
        <input type="checkbox" checked={exchangeable} onChange={(e) => setExchangeable(e.target.checked)} />
        {tr("Open to swapping or lending this copy", "这本书可以交换或出借")}
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
          {busy ? tr("Saving…", "保存中…") : tr("Save", "保存")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
        >
          {tr("Cancel", "取消")}
        </button>
      </div>
    </form>
  );
}
