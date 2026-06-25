import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PatternLock from "@/components/PatternLock";
import PinPad from "@/components/PinPad";
import { useSecurity } from "@/context/SecurityContext";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsView = "main" | "changeSecurity" | "verifyOld" | "newPin" | "confirmPin" | "newPattern" | "confirmPattern";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { method, captures, deleteAllCaptures, lock, checkPin, checkPattern, setupPin, setupPattern } = useSecurity();

  const [view, setView] = useState<SettingsView>("main");
  const [pinInput, setPinInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPattern, setNewPattern] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(true);
  const [selectedNewMethod, setSelectedNewMethod] = useState<"pin" | "pattern">(method);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const handleDeleteAll = () => {
    Alert.alert("Delete All Captures", "Permanently delete all intruder photos?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteAllCaptures();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleResetApp = () => {
    Alert.alert("Reset App", "This will erase your PIN/pattern and all captures. You'll need to set up again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset Everything",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          lock();
          router.replace("/setup");
        },
      },
    ]);
  };

  const handleVerifyOld = async (entered: string) => {
    let ok = false;
    if (method === "pin") {
      ok = await checkPin(entered);
    }
    if (ok) {
      setPinInput("");
      setCreating(true);
      setView(selectedNewMethod === "pin" ? "newPin" : "newPattern");
    } else {
      setError("Incorrect — try again");
      setPinInput("");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleVerifyOldPattern = async (pattern: number[]) => {
    const ok = await checkPattern(pattern);
    if (ok) {
      setCreating(true);
      setView(selectedNewMethod === "pin" ? "newPin" : "newPattern");
    } else {
      setError("Incorrect pattern");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleNewPin = (pin: string) => {
    setNewPin(pin);
    setCreating(false);
    setView("confirmPin");
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin === newPin) {
      await setupPin(pin, "pin");
      Alert.alert("Success", "Your PIN has been updated.");
      setView("main");
    } else {
      setError("PINs don't match");
      setPinInput("");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleNewPattern = (pattern: number[]) => {
    setNewPattern(pattern);
    setCreating(false);
    setView("confirmPattern");
  };

  const handleConfirmPattern = async (pattern: number[]) => {
    if (JSON.stringify(pattern) === JSON.stringify(newPattern)) {
      await setupPattern(pattern);
      Alert.alert("Success", "Your pattern has been updated.");
      setView("main");
    } else {
      setError("Patterns don't match");
      setTimeout(() => setError(""), 2000);
    }
  };

  const renderSecurityChange = () => (
    <View style={styles.flexCenter}>
      <Text style={[styles.sectionHeadline, { color: colors.foreground }]}>
        {view === "verifyOld" ? "Verify Current" : view === "newPin" || view === "newPattern" ? "New Security" : "Confirm"}
      </Text>
      {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}

      {view === "verifyOld" && method === "pin" && (
        <PinPad value={pinInput} onChange={setPinInput} onSubmit={handleVerifyOld} maxLength={6} />
      )}
      {view === "verifyOld" && method === "pattern" && (
        <PatternLock onComplete={handleVerifyOldPattern} onError={msg => setError(msg)} />
      )}
      {view === "newPin" && (
        <PinPad value={pinInput} onChange={setPinInput} onSubmit={handleNewPin} maxLength={6} />
      )}
      {view === "confirmPin" && (
        <PinPad value={pinInput} onChange={setPinInput} onSubmit={handleConfirmPin} maxLength={6} />
      )}
      {view === "newPattern" && (
        <PatternLock onComplete={handleNewPattern} onError={msg => setError(msg)} />
      )}
      {view === "confirmPattern" && (
        <PatternLock onComplete={handleConfirmPattern} onError={msg => setError(msg)} />
      )}
    </View>
  );

  const SettingRow = ({
    icon,
    label,
    sublabel,
    onPress,
    danger = false,
    value,
  }: {
    icon: string;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    danger?: boolean;
    value?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.settingIcon, { backgroundColor: (danger ? colors.destructive : colors.primary) + "22" }]}>
        <Feather name={icon as any} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
        {sublabel ? <Text style={[styles.settingSubLabel, { color: colors.mutedForeground }]}>{sublabel}</Text> : null}
      </View>
      {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
      {onPress && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => view === "main" ? router.back() : setView("main")}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {view === "main" ? "Settings" : "Change Security"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {view !== "main" ? (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          {view === "changeSecurity" ? (
            <View style={styles.flexCenter}>
              <Text style={[styles.sectionHeadline, { color: colors.foreground }]}>New Lock Type</Text>
              <View style={styles.methodRow}>
                {(["pin", "pattern"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      setSelectedNewMethod(m);
                      setPinInput("");
                      setView("verifyOld");
                    }}
                    style={[
                      styles.methodBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: selectedNewMethod === m ? colors.primary : colors.border,
                        borderWidth: 2,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Feather name={m === "pin" ? "hash" : "grid"} size={28} color={m === "pin" ? colors.primary : colors.accent} />
                    <Text style={[styles.methodLabel, { color: colors.foreground }]}>{m === "pin" ? "PIN Code" : "Pattern"}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            renderSecurityChange()
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Security */}
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>SECURITY</Text>
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="lock"
              label="Lock Method"
              sublabel="Currently active"
              value={method === "pin" ? "6-Digit PIN" : "Pattern Lock"}
            />
            <SettingRow
              icon="refresh-cw"
              label="Change Security"
              sublabel="Switch method or update credentials"
              onPress={() => { setPinInput(""); setError(""); setView("changeSecurity"); }}
            />
          </View>

          {/* Vault */}
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>VAULT</Text>
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="camera"
              label="Captures"
              value={`${captures.length} photo${captures.length !== 1 ? "s" : ""}`}
            />
            <SettingRow
              icon="trash-2"
              label="Delete All Captures"
              sublabel="Permanently removes all intruder photos"
              onPress={handleDeleteAll}
              danger
            />
          </View>

          {/* Danger */}
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>DANGER ZONE</Text>
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="alert-triangle"
              label="Reset App"
              sublabel="Erase everything and start over"
              onPress={handleResetApp}
              danger
            />
          </View>

          <Text style={[styles.version, { color: colors.mutedForeground }]}>
            PhoneGuard v1.0
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scrollContent: { padding: 20, gap: 8 },
  groupLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginLeft: 4, marginTop: 12 },
  group: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  settingSubLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 24 },
  flexCenter: { alignItems: "center", gap: 24 },
  sectionHeadline: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  methodRow: { flexDirection: "row", gap: 12 },
  methodBtn: { flex: 1, padding: 20, borderRadius: 14, alignItems: "center", gap: 10 },
  methodLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
