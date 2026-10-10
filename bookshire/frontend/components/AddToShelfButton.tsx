"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addBookToShelf } from "@/lib/api";

type AddToShelfButtonProps = {
  userId: string;
  bookId: string;
};

export function AddToShelfButton({ userId, bookId }: AddToShelfButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd() {
    setIsLoading(true);
    setMessage(null);

    try {
      await addBookToShelf(userId, bookId);
      setMessage("Added to your shelf.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to add to shelf."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleAdd}
        className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
      >
        {isLoading ? "Adding..." : "Add to My Shelf"}
      </button>

      {message && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>{message}</span>
          <Link href="/shelf" className="font-semibold text-gray-950 underline underline-offset-4">
            Open My Shelf
          </Link>
        </div>
      )}
    </div>
  );
}
