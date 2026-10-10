import { Link, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getErrorMessage,
  getUserBooks,
  removeUserBook,
  updateUserBookStatus,
  type UserBook,
} from "../lib/api";
import {
  getShelfStatusLabel,
  normalizeShelfStatus,
  SHELF_STATUS_OPTIONS,
  toShelfApiStatus,
  type ShelfStatus,
} from "../lib/shelfStatus";
import { ShelfStatusButtons } from "../components/ShelfStatusButtons";
import {
  ActionButton,
  AppHeader,
  EmptyCard,
  ErrorCard,
  LoadingCard,
  NavLinks,
  SectionHeader,
  TagChips,
} from "../components/UiPrimitives";
import { bookDetailHref, getDemoUserId } from "../lib/routes";

const DEMO_USER_ID = getDemoUserId();

function getShelfTitle(item: UserBook): string {
  return (
    item.book_title ||
    item.edition_title ||
    item.book_id ||
    item.edition_id ||
    "Untitled Book"
  );
}

function getShelfSubtitle(item: UserBook): string | null {
  return item.book_subtitle || item.edition_language || null;
}

function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    const confirmed = typeof window === "undefined" ? true : window.confirm(`${title}\n\n${message}`);
    if (confirmed) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: onConfirm },
  ]);
}

export default function MobileShelfScreen() {
  const [items, setItems] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadShelf({ quiet = false }: { quiet?: boolean } = {}) {
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      setError(null);
      setItems(await getUserBooks(DEMO_USER_ID));
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load My Shelf."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleStatusChange(userBookId: string, status: ShelfStatus) {
    try {
      setUpdatingId(userBookId);
      setMessage(null);
      setError(null);

      const apiStatus = toShelfApiStatus(status);
      const updated = await updateUserBookStatus(DEMO_USER_ID, userBookId, apiStatus);

      setItems((current) =>
        current.map((item) =>
          item.id === userBookId ? { ...item, ...updated, status: apiStatus } : item,
        ),
      );

      setMessage(`Moved to ${getShelfStatusLabel(status)}.`);
      await loadShelf({ quiet: true });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to update shelf item."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeShelfItem(userBookId: string) {
    try {
      setUpdatingId(userBookId);
      setMessage(null);
      setError(null);

      await removeUserBook(DEMO_USER_ID, userBookId);
      setItems((current) => current.filter((item) => item.id !== userBookId));
      setMessage("Removed from My Shelf.");
      await loadShelf({ quiet: true });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to remove shelf item."));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleRemove(item: UserBook) {
    const title = getShelfTitle(item);
    confirmAction(
      "Remove from My Shelf?",
      `This will remove “${title}” from your shelf. You can add it again from the book detail page later.`,
      () => removeShelfItem(item.id),
    );
  }

  useFocusEffect(
    useCallback(() => {
      loadShelf();
    }, []),
  );

  const groupedItems = useMemo(() => {
    return SHELF_STATUS_OPTIONS.map((status) => ({
      ...status,
      items: items.filter((item) => normalizeShelfStatus(item.status) === status.value),
    }));
  }, [items]);

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingCard label="Loading My Shelf..." />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppHeader
        title="My Shelf"
        subtitle="Track books you want to read, are reading, finished, or abandoned."
      />

      <NavLinks includeShelf={false} right={
        <Pressable onPress={() => loadShelf({ quiet: true })} disabled={refreshing || loading}>
          <Text style={[styles.inlineLink, refreshing ? styles.disabledText : null]}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Text>
        </Pressable>
      } />

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? (
        <ErrorCard
          title="Shelf action failed"
          message={error}
          onRetry={() => loadShelf({ quiet: true })}
          retryLabel="Reload Shelf"
        />
      ) : null}

      {items.length === 0 ? (
        <EmptyCard
          title="Your shelf is empty."
          message="Go back to Home or Search and add a book to My Shelf."
        />
      ) : null}

      {groupedItems.map((group) => (
        <View key={group.value} style={styles.section}>
          <SectionHeader title={group.label} count={group.items.length} />

          {group.items.length === 0 ? (
            <Text style={styles.emptySection}>No books here yet.</Text>
          ) : (
            group.items.map((item) => {
              const bookId = item.book_id;
              const title = getShelfTitle(item);
              const subtitle = getShelfSubtitle(item);
              const disabled = updatingId === item.id;
              const meta = Array.from(new Set([...(item.book_categories || []), ...(item.book_tags || [])]));

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    {bookId ? (
                      <Link href={bookDetailHref(bookId)} style={styles.bookTitle}>
                        {title}
                      </Link>
                    ) : (
                      <Text style={styles.bookTitle}>{title}</Text>
                    )}

                    {subtitle ? <Text style={styles.bookSubtitle}>{subtitle}</Text> : null}
                    <Text style={styles.currentStatus}>
                      Current status: {getShelfStatusLabel(item.status)}
                    </Text>
                  </View>

                  <TagChips items={meta} />

                  <View style={styles.statusBlock}>
                    <Text style={styles.label}>Change Status</Text>
                    <ShelfStatusButtons
                      value={item.status}
                      disabled={disabled}
                      onChange={(status) => handleStatusChange(item.id, status)}
                    />
                  </View>

                  <View style={styles.actionsRow}>
                    {bookId ? <ActionButton label="Open Detail" href={bookDetailHref(bookId)} /> : null}
                    <ActionButton
                      label={disabled ? "Working..." : "Remove from Shelf"}
                      variant="danger"
                      disabled={disabled}
                      onPress={() => handleRemove(item)}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 18, backgroundColor: "#f8fafc", minHeight: "100%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: 24 },
  section: { gap: 10 },
  emptySection: { color: "#64748b", fontStyle: "italic" },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: { gap: 4 },
  bookTitle: { fontSize: 19, fontWeight: "900", color: "#0f172a" },
  bookSubtitle: { fontSize: 15, color: "#475569", lineHeight: 22 },
  currentStatus: { color: "#64748b", fontSize: 13, fontWeight: "800" },
  statusBlock: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  success: { color: "#166534", fontWeight: "800" },
  inlineLink: { color: "#2563eb", fontWeight: "900", fontSize: 15 },
  disabledText: { opacity: 0.55 },
});
