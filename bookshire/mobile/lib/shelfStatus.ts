import type { ReadingStatus } from "./api";

export type ShelfStatus = "want_to_read" | "reading" | "finished" | "abandoned";

export type RawShelfStatus = ReadingStatus | string | null | undefined;

export type ShelfStatusOption = {
  value: ShelfStatus;
  label: string;
  apiValue: ReadingStatus;
};

/**
 * Canonical UI statuses used by the mobile app.
 *
 * Current backend still uses older enum values:
 * - unread => want_to_read
 * - read   => finished
 *
 * Keep that compatibility here so screens do not each invent their own mapping.
 */
export const SHELF_STATUS_OPTIONS: ShelfStatusOption[] = [
  { value: "want_to_read", label: "Want to Read", apiValue: "unread" },
  { value: "reading", label: "Reading", apiValue: "reading" },
  { value: "finished", label: "Finished", apiValue: "read" },
  { value: "abandoned", label: "Abandoned", apiValue: "abandoned" },
];

export const SHELF_STATUS_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  finished: "Finished",
  abandoned: "Abandoned",
};

export function normalizeShelfStatus(status: RawShelfStatus): ShelfStatus {
  switch (status) {
    case "unread":
    case "want_to_read":
      return "want_to_read";
    case "read":
    case "finished":
      return "finished";
    case "reading":
      return "reading";
    case "abandoned":
      return "abandoned";
    default:
      return "want_to_read";
  }
}

export function getShelfStatusLabel(status: RawShelfStatus): string {
  return SHELF_STATUS_LABELS[normalizeShelfStatus(status)];
}

export function toShelfApiStatus(status: RawShelfStatus): ReadingStatus {
  const normalized = normalizeShelfStatus(status);
  const option = SHELF_STATUS_OPTIONS.find((item) => item.value === normalized);
  return option?.apiValue ?? "unread";
}

export function isSameShelfStatus(a: RawShelfStatus, b: RawShelfStatus): boolean {
  return normalizeShelfStatus(a) === normalizeShelfStatus(b);
}
