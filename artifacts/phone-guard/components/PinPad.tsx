import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface PinPadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (pin: string) => void;
  maxLength?: number;
  shake?: boolean;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export default function PinPad({
  value,
  onChange,
  onSubmit,
  maxLength = 6,
  shake = false,
}: PinPadProps) {
  const colors = useColors();

  const handleKey = (key: string) => {
    if (key === "⌫") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value.slice(0, -1));
    } else if (key === "") {
      return;
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newVal = value + key;
      onChange(newVal);
      if (newVal.length >= maxLength) {
        setTimeout(() => onSubmit(newVal), 80);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* PIN dots */}
      <View style={[styles.dotsRow, shake && styles.shake]}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                borderColor: colors.primary,
                backgroundColor:
                  i < value.length ? colors.primary : "transparent",
              },
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                onPress={() => handleKey(key)}
                activeOpacity={key === "" ? 1 : 0.6}
                style={[
                  styles.key,
                  key === "" && styles.keyEmpty,
                  {
                    backgroundColor:
                      key === "" ? "transparent" : colors.secondary,
                  },
                ]}
                disabled={key === ""}
              >
                <Text
                  style={[
                    styles.keyText,
                    { color: key === "⌫" ? colors.accent : colors.foreground },
                  ]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 32,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  shake: {
    transform: [{ translateX: 0 }],
  },
  keypad: {
    gap: 12,
    width: "100%",
    paddingHorizontal: 32,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    opacity: 0,
  },
  keyText: {
    fontSize: 28,
    fontFamily: "Inter_500Medium",
  },
});
