import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  isSameShelfStatus,
  SHELF_STATUS_OPTIONS,
  type RawShelfStatus,
  type ShelfStatus,
} from "../lib/shelfStatus";

export function ShelfStatusButtons({
  value,
  disabled,
  onChange,
}: {
  value: RawShelfStatus;
  disabled?: boolean;
  onChange: (status: ShelfStatus) => void;
}) {
  return (
    <View style={styles.statusButtons}>
      {SHELF_STATUS_OPTIONS.map((status) => {
        const active = isSameShelfStatus(value, status.value);

        return (
          <Pressable
            key={status.value}
            style={[
              styles.statusButton,
              active ? styles.statusButtonActive : null,
              disabled ? styles.statusButtonDisabled : null,
            ]}
            disabled={disabled || active}
            onPress={() => onChange(status.value)}
          >
            <Text
              style={[
                styles.statusButtonText,
                active ? styles.statusButtonTextActive : null,
              ]}
            >
              {status.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  statusButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  statusButtonActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  statusButtonDisabled: { opacity: 0.6 },
  statusButtonText: { color: "#0f172a", fontWeight: "800", fontSize: 13 },
  statusButtonTextActive: { color: "white" },
});
