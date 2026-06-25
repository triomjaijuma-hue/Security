import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";

interface IntruderCaptureProps {
  onComplete: (frontUri?: string, backUri?: string) => void;
}

const savePhoto = async (uri: string, filename: string): Promise<string> => {
  const dir = `${FileSystem.documentDirectory}phoneguard/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
};

export default function IntruderCapture({ onComplete }: IntruderCaptureProps) {
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    if (Platform.OS === "web") {
      onComplete(undefined, undefined);
      return;
    }

    (async () => {
      let frontUri: string | undefined;
      let backUri: string | undefined;

      try {
        // Capture front camera silently
        const front = await ImagePicker.launchCameraAsync({
          cameraType: ImagePicker.CameraType.front,
          quality: 0.85,
          allowsEditing: false,
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          exif: false,
        });
        if (!front.canceled && front.assets?.[0]?.uri) {
          frontUri = await savePhoto(
            front.assets[0].uri,
            `intruder_front_${Date.now()}.jpg`
          );
        }
      } catch {
        // Silent fail
      }

      try {
        // Capture back camera
        const back = await ImagePicker.launchCameraAsync({
          cameraType: ImagePicker.CameraType.back,
          quality: 0.85,
          allowsEditing: false,
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          exif: false,
        });
        if (!back.canceled && back.assets?.[0]?.uri) {
          backUri = await savePhoto(
            back.assets[0].uri,
            `intruder_back_${Date.now()}.jpg`
          );
        }
      } catch {
        // Silent fail
      }

      onComplete(frontUri, backUri);
    })();
  }, []);

  return <View style={{ position: "absolute", width: 0, height: 0 }} />;
}
