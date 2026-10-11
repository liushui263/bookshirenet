import type { CategoryId } from "@/lib/discovery/fetchBooks";

// Category buttons on the new-release lists, in display order.
export const CATEGORY_IDS: CategoryId[] = [
  "fiction",
  "history",
  "biography",
  "science",
  "business",
  "psychology",
  "children",
];

export const CATEGORY_LABELS: Record<CategoryId, { en: string; zh: string }> = {
  fiction: { en: "Fiction", zh: "小说" },
  history: { en: "History", zh: "历史" },
  biography: { en: "Biography", zh: "传记" },
  science: { en: "Science", zh: "科普" },
  business: { en: "Business", zh: "经管" },
  psychology: { en: "Psychology", zh: "心理" },
  children: { en: "Children", zh: "童书" },
};
