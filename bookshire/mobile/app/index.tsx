import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";

import { Book, getBooks, getErrorMessage } from "../lib/api";
import { BookListCard } from "../components/BookListCard";
import {
  ActionButton,
  AppHeader,
  EmptyCard,
  ErrorCard,
  LoadingCard,
  SectionHeader,
} from "../components/UiPrimitives";

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const featuredBooks = useMemo(() => books.slice(0, 20), [books]);

  async function loadBooks({ quiet = false }: { quiet?: boolean } = {}) {
    try {
      quiet ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);
      setBooks(await getBooks());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load books."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={!isLoading && !errorMessage ? featuredBooks : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppHeader
              title="Build your personal book world."
              subtitle="Browse, search, review, and manage your shelf from the same FastAPI backend used by the web app."
            />

            <View style={styles.navButtons}>
              <ActionButton label="Search" variant="primary" href="/search" />
              <ActionButton label="My Shelf" href="/shelf" />
              <ActionButton
                label={isRefreshing ? "Refreshing..." : "Refresh"}
                disabled={isRefreshing || isLoading}
                onPress={() => loadBooks({ quiet: true })}
              />
            </View>

            {isLoading ? <LoadingCard label="Loading books..." /> : null}
            {errorMessage ? (
              <ErrorCard
                title="Book API failed"
                message={errorMessage}
                onRetry={() => loadBooks()}
              />
            ) : null}
            {!isLoading && !errorMessage && books.length === 0 ? (
              <EmptyCard
                title="No books yet."
                message="The backend is reachable, but it returned an empty book list. Add seed data or create a book from the API."
              />
            ) : null}

            {!isLoading && !errorMessage && books.length > 0 ? (
              <SectionHeader title="Available Books" count={books.length} />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <BookListCard book={item} maxTags={4} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 20, paddingBottom: 48, gap: 14 },
  headerBlock: { gap: 14 },
  navButtons: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
});
