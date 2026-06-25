import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSecurity, type IntruderCapture } from "@/context/SecurityContext";
import { useColors } from "@/hooks/useColors";

export default function VaultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { captures, lock, deleteAllCaptures } = useSecurity();
  const [selectedCapture, setSelectedCapture] = useState<IntruderCapture | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const handleLock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lock();
    router.replace("/lock");
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Captures",
      "This will permanently delete all intruder photos. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await deleteAllCaptures();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCapture = ({ item, index }: { item: IntruderCapture; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setSelectedCapture(item)}
      style={[styles.captureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.captureHeader}>
        <View style={[styles.intruderBadge, { backgroundColor: colors.destructive + "22" }]}>
          <Feather name="alert-circle" size={12} color={colors.destructive} />
          <Text style={[styles.intruderLabel, { color: colors.destructive }]}>
            Intruder #{captures.length - index}
          </Text>
        </View>
        <Text style={[styles.captureTime, { color: colors.mutedForeground }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>

      <View style={styles.photosRow}>
        {/* Front camera */}
        <TouchableOpacity
          style={[styles.photoContainer, { backgroundColor: colors.muted }]}
          onPress={() => item.frontUri && setPreviewUri(item.frontUri)}
          activeOpacity={0.85}
        >
          {item.frontUri ? (
            <Image
              source={{ uri: item.frontUri }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={styles.noPhoto}>
              <Feather name="user" size={24} color={colors.mutedForeground} />
            </View>
          )}
          <View style={[styles.photoLabel, { backgroundColor: colors.card + "CC" }]}>
            <Feather name="user" size={10} color={colors.foreground} />
            <Text style={[styles.photoLabelText, { color: colors.foreground }]}>Front</Text>
          </View>
        </TouchableOpacity>

        {/* Back camera */}
        <TouchableOpacity
          style={[styles.photoContainer, { backgroundColor: colors.muted }]}
          onPress={() => item.backUri && setPreviewUri(item.backUri)}
          activeOpacity={0.85}
        >
          {item.backUri ? (
            <Image
              source={{ uri: item.backUri }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={styles.noPhoto}>
              <Feather name="camera" size={24} color={colors.mutedForeground} />
            </View>
          )}
          <View style={[styles.photoLabel, { backgroundColor: colors.card + "CC" }]}>
            <Feather name="camera" size={10} color={colors.foreground} />
            <Text style={[styles.photoLabelText, { color: colors.foreground }]}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <Feather name="shield" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Intruder Vault
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {captures.length === 0
                ? "No captures yet"
                : `${captures.length} capture${captures.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLock}
            style={[styles.iconBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Feather name="lock" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Captures list */}
      {captures.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="eye-off" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No intrusions detected
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Intruder photos will appear here after 2 wrong unlock attempts
          </Text>
        </View>
      ) : (
        <FlatList
          data={captures}
          keyExtractor={(item) => item.id}
          renderItem={renderCapture}
          contentContainerStyle={[styles.list, { paddingBottom: botPad + 20 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            captures.length > 0 ? (
              <TouchableOpacity
                onPress={handleDeleteAll}
                style={styles.deleteAllBtn}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={13} color={colors.destructive} />
                <Text style={[styles.deleteAllText, { color: colors.destructive }]}>
                  Delete All
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Full-screen photo preview modal */}
      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              contentFit="contain"
            />
          )}
          <View style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Feather name="x" size={20} color={colors.foreground} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  deleteAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-end",
    paddingVertical: 6,
    marginBottom: 4,
  },
  deleteAllText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  captureCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  captureHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  intruderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  intruderLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  captureTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  photosRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoContainer: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    flex: 1,
  },
  noPhoto: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoLabelText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
