import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Book, getErrorMessage, searchBooks } from "../lib/api";
import { BookListCard } from "../components/BookListCard";
import {
  AppHeader,
  EmptyCard,
  ErrorCard,
  LoadingCard,
  NavLinks,
  SectionHeader,
} from "../components/UiPrimitives";

export default function MobileSearchScreen() {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSearched = lastQuery.length > 0;
  const canSearch = useMemo(() => query.trim().length > 0 && !loading, [query, loading]);

  async function handleSearch(searchValue = query) {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      setBooks([]);
      setLastQuery("");
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLastQuery(trimmed);
      setBooks(await searchBooks(trimmed));
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Search failed. Check that the backend is reachable from Expo."));
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setLastQuery("");
    setBooks([]);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={!loading && !error ? books : []}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppHeader
              title="Search books"
              subtitle="Search by title, subtitle, category, tag, or description."
            />

            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearch()}
                placeholder="Try fiction, self-help, history..."
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.input}
              />
              <Pressable
                style={[styles.searchButton, !canSearch ? styles.disabled : null]}
                onPress={() => handleSearch()}
                disabled={!canSearch}
              >
                <Text style={styles.searchButtonText}>{loading ? "..." : "Search"}</Text>
              </Pressable>
            </View>

            <NavLinks includeSearch={false} right={hasSearched ? (
              <Pressable onPress={clearSearch}>
                <Text style={styles.clearLink}>Clear</Text>
              </Pressable>
            ) : null} />

            {!hasSearched && !loading ? (
              <EmptyCard
                title="Start with a keyword."
                message="Examples: fiction, productivity, politics, habits, science."
              />
            ) : null}

            {loading ? <LoadingCard label={`Searching “${lastQuery || query.trim()}”...`} /> : null}

            {error ? (
              <ErrorCard
                title="Search failed"
                message={error}
                onRetry={() => handleSearch(lastQuery || query)}
              />
            ) : null}

            {hasSearched && !loading && !error ? (
              <SectionHeader title={`Results for “${lastQuery}”`} count={books.length} />
            ) : null}

            {hasSearched && !loading && !error && books.length === 0 ? (
              <EmptyCard
                title="No matching books."
                message="Try a broader category or check that backend search includes categories/tags."
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <BookListCard book={item} maxTags={5} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 20, paddingBottom: 48, gap: 12 },
  headerBlock: { gap: 14 },
  searchRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { color: "white", fontWeight: "900" },
  disabled: { opacity: 0.55 },
  clearLink: { color: "#2563eb", fontWeight: "900", fontSize: 15 },
});
