"use client";

import { useRef, useState } from "react";
import type { ShelfImportResult, UserBook } from "@/lib/api";
import { addMyBookByIsbn, importShelfFile, shelfExportUrl } from "@/lib/api";
import { useT } from "@/components/LocaleProvider";

type ShelfToolsProps = {
  onAdded: (item: UserBook) => void;
  onImported: () => Promise<void>;
};

const MAX_FILE_BYTES = 2_000_000;

export function ShelfTools({ onAdded, onImported }: ShelfToolsProps) {
  const tr = useT();
  const [isbn, setIsbn] = useState("");
  const [isbnBusy, setIsbnBusy] = useState(false);
  const [isbnMessage, setIsbnMessage] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ShelfImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleAddByIsbn(event: React.FormEvent) {
    event.preventDefault();
    if (!isbn.trim()) return;
    setIsbnBusy(true);
    setIsbnMessage(null);
    try {
      const item = await addMyBookByIsbn(isbn.trim());
      onAdded(item);
      setIsbn("");
      setIsbnMessage(tr(`Added "${item.book_title}".`, `已添加《${item.book_title}》。`));
    } catch (error) {
      setIsbnMessage(error instanceof Error ? error.message : tr("Could not add that ISBN.", "无法添加这个 ISBN。"));
    } finally {
      setIsbnBusy(false);
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportMessage(null);
    setImportResult(null);
    if (file.size > MAX_FILE_BYTES) {
      setImportMessage(tr("That file is too big. Files can be up to 2 MB.", "文件太大，最大 2 MB。"));
      return;
    }

    const format = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";
    setImportBusy(true);
    try {
      const result = await importShelfFile(format, await file.text());
      setImportResult(result);
      await onImported();
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : tr("Could not import that file.", "无法导入这个文件。"));
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <section className="mb-8 grid gap-5 md:grid-cols-2">
      <form
        onSubmit={handleAddByIsbn}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold text-gray-950">{tr("Add a book by ISBN", "按 ISBN 添加图书")}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {tr(
            "The 10 or 13 digit number on the back cover or copyright page.",
            "封底或版权页上的 10 位或 13 位数字。",
          )}
        </p>
        <div className="mt-4 flex gap-2">
          <label htmlFor="isbn-input" className="sr-only">
            ISBN
          </label>
          <input
            id="isbn-input"
            value={isbn}
            onChange={(event) => setIsbn(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="978-7-5063-6543-7"
            className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={isbnBusy || !isbn.trim()}
            className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isbnBusy ? tr("Looking up…", "查找中…") : tr("Add", "添加")}
          </button>
        </div>
        {isbnMessage && (
          <p className="mt-3 text-sm text-gray-700" role="status">
            {isbnMessage}
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">{tr("Export or import", "导出或导入")}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {tr(
            "Download your shelf as a spreadsheet (CSV) or JSON, or add books from a file with a",
            "将书架下载为表格（CSV）或 JSON，或从文件导入图书，文件需包含",
          )}{" "}
          <code>title</code> {tr("or", "或")} <code>isbn</code>{" "}
          {tr("column.", "列。")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={shelfExportUrl("csv")}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {tr("Export CSV", "导出 CSV")}
          </a>
          <a
            href={shelfExportUrl("json")}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {tr("Export JSON", "导出 JSON")}
          </a>
          <button
            type="button"
            disabled={importBusy}
            onClick={() => fileInput.current?.click()}
            className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {importBusy ? tr("Importing…", "导入中…") : tr("Import file", "导入文件")}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={handleFile}
            className="hidden"
            aria-label={tr("Choose a CSV or JSON file to import", "选择要导入的 CSV 或 JSON 文件")}
          />
        </div>
        {importMessage && (
          <p className="mt-3 text-sm text-red-700" role="status">
            {importMessage}
          </p>
        )}
        {importResult && (
          <div className="mt-3 text-sm text-gray-700" role="status">
            <p>
              {tr(
                `Added ${importResult.added}, updated ${importResult.updated}${
                  importResult.failed > 0 ? `, ${importResult.failed} could not be imported` : ""
                }.`,
                `新增 ${importResult.added} 本，更新 ${importResult.updated} 本${
                  importResult.failed > 0 ? `，${importResult.failed} 本无法导入` : ""
                }。`,
              )}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
                {importResult.errors.map((error) => (
                  <li key={error.row}>
                    {tr(`Row ${error.row}`, `第 ${error.row} 行`)}
                    {error.title ? ` (${error.title})` : ""}
                    {tr(":", "：")} {error.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
