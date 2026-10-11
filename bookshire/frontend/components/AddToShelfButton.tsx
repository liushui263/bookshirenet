"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addBookToMyShelf } from "@/lib/api";
import { useT } from "@/components/LocaleProvider";

type AddToShelfButtonProps = {
  bookId: string;
  signedIn: boolean;
};

export function AddToShelfButton({ bookId, signedIn }: AddToShelfButtonProps) {
  const router = useRouter();
  const tr = useT();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd() {
    setIsLoading(true);
    setMessage(null);

    try {
      await addBookToMyShelf(bookId);
      setMessage(tr("Added to your shelf.", "已加入你的书架。"));
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : tr("Failed to add to shelf.", "加入书架失败。")
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/books/${bookId}`)}`}
        className="inline-block rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
      >
        {tr("Sign in to add to your shelf", "登录后加入书架")}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleAdd}
        className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
      >
        {isLoading ? tr("Adding...", "正在加入…") : tr("Add to My Shelf", "加入我的书架")}
      </button>

      {message && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>{message}</span>
          <Link href="/shelf" className="font-semibold text-gray-950 underline underline-offset-4">
            {tr("Open My Shelf", "打开我的书架")}
          </Link>
        </div>
      )}
    </div>
  );
}
