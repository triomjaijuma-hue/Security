import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PatternLock from "@/components/PatternLock";
import PinPad from "@/components/PinPad";
import { useSecurity, type SecurityMethod } from "@/context/SecurityContext";
import { useColors } from "@/hooks/useColors";

type Step = "welcome" | "method" | "create" | "confirm";

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setupPin, setupPattern, setCameraPermission } = useSecurity();
  const [cameraPermission, requestPermission] = ImagePicker.useCameraPermissions();

  const [step, setStep] = useState<Step>("welcome");
  const [method, setMethod] = useState<SecurityMethod>("pin");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pattern, setPattern] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(true);

  const handlePermission = async () => {
    if (Platform.OS !== "web" && !cameraPermission?.granted) {
      const result = await requestPermission();
      setCameraPermission(result.granted);
    } else {
      setCameraPermission(true);
    }
    setStep("method");
  };

  const handleMethodSelect = (m: SecurityMethod) => {
    Haptics.selectionAsync();
    setMethod(m);
    setPin("");
    setConfirmPin("");
    setCreating(true);
    setStep("create");
  };

  const handlePinCreate = (entered: string) => {
    setPin(entered);
    setCreating(false);
    setStep("confirm");
  };

  const handlePinConfirm = async (entered: string) => {
    if (entered === pin) {
      await setupPin(pin, method);
      router.replace("/lock");
    } else {
      setError("PINs don't match — try again");
      setConfirmPin("");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handlePatternCreate = (p: number[]) => {
    setPattern(p);
    setCreating(false);
    setStep("confirm");
  };

  const handlePatternConfirm = async (p: number[]) => {
    if (JSON.stringify(p) === JSON.stringify(pattern)) {
      await setupPattern(p);
      router.replace("/lock");
    } else {
      setError("Patterns don't match — try again");
      setTimeout(() => setError(""), 2500);
    }
  };

  const goBack = () => {
    setError("");
    if (step === "confirm") {
      setStep("create");
      setCreating(true);
      setPin("");
      setConfirmPin("");
    } else if (step === "create") {
      setStep("method");
    } else if (step === "method") {
      setStep("welcome");
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const stepIndex = { welcome: -1, method: 0, create: 1, confirm: 2 }[step];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        {step !== "welcome" && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Feather name="shield" size={26} color={colors.primary} />
          <Text style={[styles.appTitle, { color: colors.foreground }]}>PhoneGuard</Text>
        </View>
      </View>

      {/* Step dots */}
      {step !== "welcome" && (
        <View style={styles.stepDots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                { backgroundColor: stepIndex >= i ? colors.primary : colors.muted },
              ]}
            />
          ))}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {step === "welcome" && (
          <View style={styles.centeredContent}>
            <View style={[styles.bigIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="camera" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.headline, { color: colors.foreground }]}>
              Intruder Detection
            </Text>
            <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
              PhoneGuard silently photographs anyone who fails to unlock your
              device — using both front and back cameras — without any shutter sound.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handlePermission}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                {Platform.OS === "web" ? "Get Started" : "Allow Camera & Continue"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "method" && (
          <View style={styles.centeredContent}>
            <Text style={[styles.headline, { color: colors.foreground }]}>Choose Lock Type</Text>
            <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
              Pick how you'll unlock your device
            </Text>
            <View style={styles.methodCards}>
              <TouchableOpacity
                style={[styles.methodCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleMethodSelect("pin")}
                activeOpacity={0.8}
              >
                <Feather name="hash" size={32} color={colors.primary} />
                <Text style={[styles.methodTitle, { color: colors.foreground }]}>PIN Code</Text>
                <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                  6-digit numeric PIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleMethodSelect("pattern")}
                activeOpacity={0.8}
              >
                <Feather name="grid" size={32} color={colors.accent} />
                <Text style={[styles.methodTitle, { color: colors.foreground }]}>Pattern</Text>
                <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                  Draw on a 3×3 grid
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === "create" && (
          <View style={styles.centeredContent}>
            <Text style={[styles.headline, { color: colors.foreground }]}>
              {method === "pin" ? "Set Your PIN" : "Draw Your Pattern"}
            </Text>
            <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
              {method === "pin"
                ? "Choose a 6-digit PIN you'll remember"
                : "Connect at least 4 dots"}
            </Text>
            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            ) : null}
            {method === "pin" ? (
              <PinPad value={pin} onChange={setPin} onSubmit={handlePinCreate} maxLength={6} />
            ) : (
              <PatternLock onComplete={handlePatternCreate} onError={setError} />
            )}
          </View>
        )}

        {step === "confirm" && (
          <View style={styles.centeredContent}>
            <Text style={[styles.headline, { color: colors.foreground }]}>
              {method === "pin" ? "Confirm PIN" : "Confirm Pattern"}
            </Text>
            <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
              {method === "pin" ? "Enter your PIN again" : "Draw the same pattern again"}
            </Text>
            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            ) : null}
            {method === "pin" ? (
              <PinPad value={confirmPin} onChange={setConfirmPin} onSubmit={handlePinConfirm} maxLength={6} />
            ) : (
              <PatternLock onComplete={handlePatternConfirm} onError={setError} />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 1,
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  appTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  stepDots: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 8,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, justifyContent: "center" },
  centeredContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  bigIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headline: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtext: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  methodCards: { flexDirection: "row", gap: 12, marginTop: 8 },
  methodCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  methodTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  methodSub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
});
