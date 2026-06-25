import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IntruderCapture from "@/components/IntruderCapture";
import PatternLock from "@/components/PatternLock";
import PinPad from "@/components/PinPad";
import { useSecurity, type IntruderCapture as ICapture } from "@/context/SecurityContext";
import { useColors } from "@/hooks/useColors";

export default function LockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    method,
    checkPin,
    checkPattern,
    unlock,
    failedAttempts,
    incrementFailedAttempts,
    resetFailedAttempts,
    addCapture,
    cameraPermissionGranted,
  } = useSecurity();

  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [time, setTime] = useState(new Date());
  const [capturing, setCapturing] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [pendingCapture, setPendingCapture] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleWrongAttempt = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerShake();
    const newAttempts = failedAttempts + 1;
    incrementFailedAttempts();
    setPin("");
    setErrorMsg(
      newAttempts >= 2
        ? `${newAttempts} failed attempts`
        : "Incorrect — try again"
    );
    // Trigger capture on every 2nd wrong attempt
    if (newAttempts >= 2 && newAttempts % 2 === 0 && cameraPermissionGranted && Platform.OS !== "web") {
      setCapturing(true);
    }
  };

  const handlePinSubmit = async (entered: string) => {
    const ok = await checkPin(entered);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetFailedAttempts();
      unlock();
      router.replace("/vault");
    } else {
      handleWrongAttempt();
    }
  };

  const handlePatternComplete = async (pattern: number[]) => {
    const ok = await checkPattern(pattern);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetFailedAttempts();
      unlock();
      router.replace("/vault");
    } else {
      handleWrongAttempt();
    }
  };

  const handlePatternError = (msg: string) => {
    setErrorMsg(msg);
    triggerShake();
  };

  const handleCaptureComplete = async (frontUri?: string, backUri?: string) => {
    setCapturing(false);
    if (frontUri || backUri) {
      const capture: ICapture = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        timestamp: Date.now(),
        frontUri,
        backUri,
      };
      await addCapture(capture);
    }
  };

  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Silent camera capture (invisible) */}
      {capturing && (
        <IntruderCapture onComplete={handleCaptureComplete} />
      )}

      {/* Top: time + lock icon */}
      <View style={styles.topSection}>
        <View style={styles.shieldRow}>
          <Feather name="shield" size={22} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.mutedForeground }]}>
            PhoneGuard
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.foreground }]}>{timeStr}</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>

        {failedAttempts > 0 && (
          <View style={[styles.warningBadge, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive + "44" }]}>
            <Feather name="alert-triangle" size={13} color={colors.destructive} />
            <Text style={[styles.warningText, { color: colors.destructive }]}>
              {failedAttempts} failed {failedAttempts === 1 ? "attempt" : "attempts"}
            </Text>
          </View>
        )}
      </View>

      {/* Middle: security input */}
      <Animated.View
        style={[styles.inputSection, { transform: [{ translateX: shakeAnim }] }]}
      >
        {errorMsg ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {errorMsg}
          </Text>
        ) : (
          <Text style={[styles.prompt, { color: colors.mutedForeground }]}>
            {method === "pin" ? "Enter PIN" : "Draw pattern"}
          </Text>
        )}

        {method === "pin" ? (
          <PinPad
            value={pin}
            onChange={setPin}
            onSubmit={handlePinSubmit}
            maxLength={6}
          />
        ) : (
          <PatternLock
            onComplete={handlePatternComplete}
            onError={handlePatternError}
          />
        )}
      </Animated.View>

      {/* Spacer at bottom */}
      <View style={styles.bottomSection}>
        {capturing && (
          <View style={styles.captureIndicator}>
            <View style={[styles.captureDot, { backgroundColor: colors.destructive }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    gap: 8,
    paddingTop: 32,
  },
  shieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  appName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  time: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
  },
  date: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  inputSection: {
    alignItems: "center",
    gap: 24,
    width: "100%",
  },
  prompt: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  bottomSection: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  captureIndicator: {
    opacity: 0,
  },
  captureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
