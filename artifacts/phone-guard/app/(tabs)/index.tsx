import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function IndexRoute() {
  useEffect(() => {
    (async () => {
      const setup = await AsyncStorage.getItem("pg_setup");
      if (setup === "true") {
        router.replace("/lock");
      } else {
        router.replace("/setup");
      }
    })();
  }, []);

  return <View style={{ flex: 1, backgroundColor: "#0A0E1A" }} />;
}
