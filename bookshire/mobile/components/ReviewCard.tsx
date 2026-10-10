import { StyleSheet, Text, View } from "react-native";

import type { Review } from "../lib/api";
import { MutedText } from "./UiPrimitives";

export function formatReviewDate(value?: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function renderStars(rating?: number | null) {
  if (!rating) return "No rating";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
        <Text style={styles.reviewDate}>{formatReviewDate(review.created_at)}</Text>
      </View>

      {review.content ? (
        <Text style={styles.reviewContent}>{review.content}</Text>
      ) : (
        <MutedText>No written review.</MutedText>
      )}

      <Text style={styles.reviewMeta}>Visibility: {review.visibility}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  reviewStars: { color: "#ca8a04", fontSize: 17, fontWeight: "900" },
  reviewDate: { color: "#64748b", fontSize: 13 },
  reviewContent: { color: "#334155", fontSize: 15, lineHeight: 22 },
  reviewMeta: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
