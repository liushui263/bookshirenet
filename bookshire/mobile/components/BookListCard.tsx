import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Book } from "../lib/api";
import { bookDetailHref } from "../lib/routes";
import { TagChips } from "./UiPrimitives";

export function getBookMeta(book: Book): string[] {
  return Array.from(new Set([...(book.categories || []), ...(book.tags || [])]));
}

export function BookListCard({ book, maxTags = 4 }: { book: Book; maxTags?: number }) {
  const meta = getBookMeta(book);

  return (
    <Pressable style={styles.card} onPress={() => router.push(bookDetailHref(book.id))}>
      <View style={styles.cover}>
        <Text style={styles.coverText}>Book</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        {book.subtitle ? <Text style={styles.bookSubtitle}>{book.subtitle}</Text> : null}
        <TagChips items={meta.slice(0, maxTags)} emptyLabel="No categories/tags" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cover: {
    width: 64,
    height: 92,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: { fontSize: 12, color: "#64748b", fontWeight: "900" },
  cardBody: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  bookSubtitle: { fontSize: 13, color: "#475569", lineHeight: 19 },
});
