import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addBookToShelf,
  Book,
  createBookReview,
  deleteReview,
  getBook,
  getBookReviews,
  getErrorMessage,
  Review,
  updateReview,
} from "../../lib/api";
import { ReviewCard, renderStars } from "../../components/ReviewCard";
import {
  ActionButton,
  AppHeader,
  BodyText,
  EmptyCard,
  ErrorCard,
  InlineLinkButton,
  LoadingCard,
  MutedText,
  NavLinks,
  SectionHeader,
  SuccessCard,
  TagChips,
} from "../../components/UiPrimitives";

import { firstRouteParam, getDemoUserId, ROUTES } from "../../lib/routes";

const DEMO_USER_ID = getDemoUserId();

export default function MobileBookDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const bookId = firstRouteParam(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);
  const [reviewContent, setReviewContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    const ratedReviews = reviews.filter((review) => typeof review.rating === "number");
    if (!ratedReviews.length) return null;

    const total = ratedReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return total / ratedReviews.length;
  }, [reviews]);

  function syncMyReview(reviewData: Review[]) {
    const mine = reviewData.find((review) => review.user_id === DEMO_USER_ID);

    if (mine) {
      setMyReviewId(mine.id);
      setSelectedRating(mine.rating || 5);
      setReviewContent(mine.content || "");
    } else {
      setMyReviewId(null);
      setSelectedRating(5);
      setReviewContent("");
    }
  }

  async function loadBook() {
    if (!bookId) {
      setError("Missing book id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReviewError(null);

      const [bookData, reviewData] = await Promise.all([
        getBook(bookId),
        getBookReviews(bookId),
      ]);

      setBook(bookData);
      setReviews(reviewData);
      syncMyReview(reviewData);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load book detail."));
    } finally {
      setLoading(false);
    }
  }

  async function reloadReviews() {
    if (!bookId) return;

    try {
      setReviewError(null);
      const reviewData = await getBookReviews(bookId);
      setReviews(reviewData);
      syncMyReview(reviewData);
    } catch (err) {
      console.error(err);
      setReviewError(getErrorMessage(err, "Failed to refresh reviews."));
    }
  }

  async function handleAddToShelf() {
    if (!book?.id) return;

    try {
      setAdding(true);
      setMessage(null);
      setError(null);
      await addBookToShelf(DEMO_USER_ID, book.id);
      setMessage("Added to My Shelf.");
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to add this book to My Shelf."));
    } finally {
      setAdding(false);
    }
  }

  async function handleSubmitReview() {
    if (!book?.id) return;

    const trimmedContent = reviewContent.trim();

    if (!selectedRating && !trimmedContent) {
      setReviewError("Choose a rating or write a short review.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);
      setReviewMessage(null);

      if (myReviewId) {
        await updateReview(myReviewId, {
          rating: selectedRating,
          content: trimmedContent || null,
          visibility: "public",
        });
      } else {
        await createBookReview(book.id, {
          user_id: DEMO_USER_ID,
          rating: selectedRating,
          content: trimmedContent || null,
          visibility: "public",
        });
      }

      setReviewMessage(myReviewId ? "Review updated." : "Review saved.");
      await reloadReviews();
    } catch (err) {
      console.error(err);
      setReviewError(getErrorMessage(err, "Failed to save review."));
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleDeleteReview() {
    if (!myReviewId) return;

    try {
      setDeletingReview(true);
      setReviewError(null);
      setReviewMessage(null);

      await deleteReview(myReviewId);

      setMyReviewId(null);
      setSelectedRating(5);
      setReviewContent("");
      setReviewMessage("Your review was deleted.");
      await reloadReviews();
    } catch (err) {
      console.error(err);
      setReviewError(getErrorMessage(err, "Failed to delete review."));
    } finally {
      setDeletingReview(false);
    }
  }

  function confirmDeleteReview() {
    const title = "Delete review?";
    const message = "This removes your review for this book. You can write a new one later.";

    if (Platform.OS === "web") {
      const confirmed = typeof window === "undefined" ? true : window.confirm(`${title}\n\n${message}`);
      if (confirmed) void handleDeleteReview();
      return;
    }

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void handleDeleteReview() },
    ]);
  }

  useEffect(() => {
    loadBook();
  }, [bookId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingCard label="Loading book..." />
      </View>
    );
  }

  if (error && !book) {
    return (
      <View style={styles.container}>
        <ErrorCard title="Book detail failed" message={error} onRetry={loadBook} />
        <NavLinks />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.container}>
        <EmptyCard title="Book not found." message="Go back to Home or Search and choose another book." />
        <NavLinks />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppHeader title={book.title} subtitle={book.subtitle || undefined} />

      <View style={styles.card}>
        <View style={styles.metaBlock}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>{book.original_language || "Unknown"}</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.label}>Rating</Text>
          <Text style={styles.ratingText}>
            {averageRating
              ? `${averageRating.toFixed(1)} / 5 from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
              : "No reviews yet"}
          </Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.label}>Description</Text>
          <BodyText>{book.canonical_description || "No description yet."}</BodyText>
        </View>

        {book.categories?.length ? (
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Categories</Text>
            <TagChips items={book.categories} />
          </View>
        ) : null}

        {book.tags?.length ? (
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Tags</Text>
            <TagChips items={book.tags} />
          </View>
        ) : null}

        <ActionButton
          label={adding ? "Adding..." : "Add to My Shelf"}
          variant="primary"
          disabled={adding}
          onPress={handleAddToShelf}
          style={styles.fullWidthButton}
        />

        {message ? (
          <SuccessCard>
            <Text style={styles.success}>{message}</Text>
            <Link href={ROUTES.shelf} style={styles.successLink}>
              Open My Shelf
            </Link>
          </SuccessCard>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.card}>
        <SectionHeader title="Rate & Review" />
        <MutedText>
          {myReviewId
            ? "You already reviewed this book. Editing below will update your existing review, not create another one."
            : "Share a quick rating or note for this book."}
        </MutedText>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <Pressable key={rating} onPress={() => setSelectedRating(rating)} style={styles.starButton}>
              <Text style={[styles.star, rating <= selectedRating ? styles.starSelected : styles.starMuted]}>
                ★
              </Text>
            </Pressable>
          ))}
          <Text style={styles.starLabel}>{renderStars(selectedRating)}</Text>
        </View>

        <TextInput
          style={styles.reviewInput}
          multiline
          value={reviewContent}
          onChangeText={setReviewContent}
          placeholder="Write a short review..."
          textAlignVertical="top"
        />

        <ActionButton
          label={submittingReview ? "Saving..." : myReviewId ? "Update My Review" : "Save Review"}
          variant="primary"
          disabled={submittingReview || deletingReview}
          onPress={handleSubmitReview}
          style={styles.fullWidthButton}
        />

        {myReviewId ? (
          <ActionButton
            label={deletingReview ? "Deleting..." : "Delete My Review"}
            variant="danger"
            disabled={submittingReview || deletingReview}
            onPress={confirmDeleteReview}
            style={styles.fullWidthButton}
          />
        ) : null}

        {reviewMessage ? <Text style={styles.success}>{reviewMessage}</Text> : null}
        {reviewError ? <Text style={styles.error}>{reviewError}</Text> : null}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Reviews"
          count={reviews.length}
          action={
            <InlineLinkButton
              label="Refresh"
              onPress={reloadReviews}
              disabled={submittingReview || deletingReview}
            />
          }
        />

        {reviews.length ? (
          <View style={styles.reviewList}>
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </View>
        ) : (
          <MutedText>No reviews yet. Be the first to add one.</MutedText>
        )}
      </View>

      <NavLinks />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 18, backgroundColor: "#f8fafc", minHeight: "100%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: 24 },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaBlock: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { fontSize: 16, color: "#0f172a" },
  ratingText: { fontSize: 16, color: "#0f172a", fontWeight: "800" },
  fullWidthButton: { borderRadius: 12, paddingVertical: 14 },
  starRow: { flexDirection: "row", gap: 4, alignItems: "center", flexWrap: "wrap" },
  starButton: { paddingRight: 6, paddingVertical: 2 },
  star: { fontSize: 32 },
  starSelected: { color: "#ca8a04" },
  starMuted: { color: "#cbd5e1" },
  starLabel: { color: "#64748b", fontWeight: "800", marginLeft: 6 },
  reviewInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  reviewList: { gap: 12 },
  success: { color: "#166534", fontWeight: "800" },
  successLink: { color: "#15803d", fontWeight: "900" },
  error: { color: "#b91c1c", fontWeight: "800" },
});
