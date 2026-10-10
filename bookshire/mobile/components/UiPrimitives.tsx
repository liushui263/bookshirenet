import { Link, router } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { ROUTES, type AppHref } from "../lib/routes";

export function AppHeader({
  title,
  subtitle,
  kicker = "BookShire",
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  return (
    <View style={styles.headerBlock}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function NavLinks({
  includeHome = true,
  includeSearch = true,
  includeShelf = true,
  right,
}: {
  includeHome?: boolean;
  includeSearch?: boolean;
  includeShelf?: boolean;
  right?: ReactNode;
}) {
  return (
    <View style={styles.navRow}>
      {includeHome ? (
        <Link href={ROUTES.home} style={styles.link}>
          Home
        </Link>
      ) : null}
      {includeSearch ? (
        <Link href={ROUTES.search} style={styles.link}>
          Search
        </Link>
      ) : null}
      {includeShelf ? (
        <Link href={ROUTES.shelf} style={styles.link}>
          My Shelf
        </Link>
      ) : null}
      {right}
    </View>
  );
}

export function ActionButton({
  label,
  variant = "secondary",
  disabled,
  onPress,
  href,
  style,
}: {
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  onPress?: PressableProps["onPress"];
  href?: AppHref;
  style?: StyleProp<ViewStyle>;
}) {
  const buttonStyle = [
    styles.button,
    variant === "primary" ? styles.primaryButton : null,
    variant === "secondary" ? styles.secondaryButton : null,
    variant === "danger" ? styles.dangerButton : null,
    variant === "ghost" ? styles.ghostButton : null,
    disabled ? styles.disabled : null,
    style,
  ];

  const textStyle = [
    styles.buttonText,
    variant === "primary" ? styles.primaryButtonText : null,
    variant === "secondary" ? styles.secondaryButtonText : null,
    variant === "danger" ? styles.dangerButtonText : null,
    variant === "ghost" ? styles.ghostButtonText : null,
  ];

  const content = <Text style={textStyle}>{label}</Text>;

  function handlePress(event: Parameters<NonNullable<PressableProps["onPress"]>>[0]) {
    if (disabled) return;
    if (onPress) {
      onPress(event);
      return;
    }
    if (href) {
      router.push(href);
    }
  }

  return (
    <Pressable style={buttonStyle} onPress={handlePress} disabled={disabled}>
      {content}
    </Pressable>
  );
}

export function LoadingCard({ label }: { label: string }) {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorCard({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function SuccessCard({ children }: { children: ReactNode }) {
  return <View style={styles.successBox}>{children}</View>;
}

export function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionActions}>
        {action}
        {typeof count === "number" ? <Text style={styles.countPill}>{count}</Text> : null}
      </View>
    </View>
  );
}

export function TagChips({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  if (!items.length) {
    return emptyLabel ? <Text style={styles.muted}>{emptyLabel}</Text> : null;
  }

  return (
    <View style={styles.tagRow}>
      {items.map((item) => (
        <Text key={item} style={styles.tag}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export function BodyText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.bodyText, style]}>{children}</Text>;
}

export function MutedText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function InlineLinkButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text style={[styles.inlineAction, disabled ? styles.disabledText : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBlock: { gap: 12 },
  kicker: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },
  navRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    alignItems: "center",
  },
  link: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 15,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: "#0f172a" },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  dangerButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  ghostButton: { backgroundColor: "transparent", paddingHorizontal: 0 },
  buttonText: { fontWeight: "900" },
  primaryButtonText: { color: "white" },
  secondaryButtonText: { color: "#0f172a" },
  dangerButtonText: { color: "#b91c1c" },
  ghostButtonText: { color: "#2563eb" },
  disabled: { opacity: 0.55 },
  disabledText: { opacity: 0.55 },
  stateCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  errorTitle: { color: "#7f1d1d", fontWeight: "900" },
  errorText: { color: "#991b1b", fontSize: 13, lineHeight: 19 },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#991b1b",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: { color: "white", fontWeight: "900" },
  emptyCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, color: "#0f172a", fontWeight: "900" },
  successBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a", flex: 1 },
  sectionActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  countPill: {
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "900",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  bodyText: { color: "#334155", fontSize: 15, lineHeight: 22 },
  muted: { color: "#64748b", lineHeight: 21 },
  inlineAction: { color: "#2563eb", fontWeight: "900" },
});


export const uiStyles = styles;
