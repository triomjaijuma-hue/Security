import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

export type SecurityMethod = "pin" | "pattern";

export interface IntruderCapture {
  id: string;
  timestamp: number;
  frontUri?: string;
  backUri?: string;
}

interface SecurityState {
  method: SecurityMethod;
  isSetupComplete: boolean;
  isUnlocked: boolean;
  failedAttempts: number;
  captures: IntruderCapture[];
  cameraPermissionGranted: boolean;
}

interface SecurityContextType extends SecurityState {
  checkPin: (pin: string) => Promise<boolean>;
  checkPattern: (pattern: number[]) => Promise<boolean>;
  setupPin: (pin: string, method: SecurityMethod) => Promise<void>;
  setupPattern: (pattern: number[]) => Promise<void>;
  unlock: () => void;
  lock: () => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  addCapture: (capture: IntruderCapture) => Promise<void>;
  deleteAllCaptures: () => Promise<void>;
  setCameraPermission: (granted: boolean) => void;
}

const KEYS = {
  pin: "pg_pin",
  pattern: "pg_pattern",
  method: "pg_method",
  captures: "pg_captures",
  setup: "pg_setup",
};

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(`secure_${key}`);
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    return AsyncStorage.setItem(`secure_${key}`, value);
  }
  return SecureStore.setItemAsync(key, value);
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SecurityState>({
    method: "pin",
    isSetupComplete: false,
    isUnlocked: false,
    failedAttempts: 0,
    captures: [],
    cameraPermissionGranted: false,
  });

  useEffect(() => {
    (async () => {
      const setup = await AsyncStorage.getItem(KEYS.setup);
      const method =
        (await AsyncStorage.getItem(KEYS.method)) as SecurityMethod | null;
      const capturesRaw = await AsyncStorage.getItem(KEYS.captures);
      const captures: IntruderCapture[] = capturesRaw
        ? JSON.parse(capturesRaw)
        : [];
      setState((s) => ({
        ...s,
        isSetupComplete: setup === "true",
        method: method ?? "pin",
        captures,
      }));
    })();
  }, []);

  const checkPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await secureGet(KEYS.pin);
    return stored === pin;
  }, []);

  const checkPattern = useCallback(
    async (pattern: number[]): Promise<boolean> => {
      const stored = await secureGet(KEYS.pattern);
      if (!stored) return false;
      const storedPattern: number[] = JSON.parse(stored);
      return JSON.stringify(storedPattern) === JSON.stringify(pattern);
    },
    []
  );

  const setupPin = useCallback(
    async (pin: string, method: SecurityMethod): Promise<void> => {
      await secureSet(KEYS.pin, pin);
      await AsyncStorage.setItem(KEYS.method, method);
      await AsyncStorage.setItem(KEYS.setup, "true");
      setState((s) => ({ ...s, method, isSetupComplete: true }));
    },
    []
  );

  const setupPattern = useCallback(async (pattern: number[]): Promise<void> => {
    await secureSet(KEYS.pattern, JSON.stringify(pattern));
    await AsyncStorage.setItem(KEYS.method, "pattern");
    await AsyncStorage.setItem(KEYS.setup, "true");
    setState((s) => ({ ...s, method: "pattern", isSetupComplete: true }));
  }, []);

  const unlock = useCallback(() => {
    setState((s) => ({ ...s, isUnlocked: true, failedAttempts: 0 }));
  }, []);

  const lock = useCallback(() => {
    setState((s) => ({ ...s, isUnlocked: false }));
  }, []);

  const incrementFailedAttempts = useCallback(() => {
    setState((s) => ({ ...s, failedAttempts: s.failedAttempts + 1 }));
  }, []);

  const resetFailedAttempts = useCallback(() => {
    setState((s) => ({ ...s, failedAttempts: 0 }));
  }, []);

  const addCapture = useCallback(async (capture: IntruderCapture) => {
    setState((s) => {
      const updated = [capture, ...s.captures];
      AsyncStorage.setItem(KEYS.captures, JSON.stringify(updated));
      return { ...s, captures: updated };
    });
  }, []);

  const deleteAllCaptures = useCallback(async () => {
    await AsyncStorage.setItem(KEYS.captures, JSON.stringify([]));
    setState((s) => ({ ...s, captures: [] }));
  }, []);

  const setCameraPermission = useCallback((granted: boolean) => {
    setState((s) => ({ ...s, cameraPermissionGranted: granted }));
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        ...state,
        checkPin,
        checkPattern,
        setupPin,
        setupPattern,
        unlock,
        lock,
        incrementFailedAttempts,
        resetFailedAttempts,
        addCapture,
        deleteAllCaptures,
        setCameraPermission,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity must be inside SecurityProvider");
  return ctx;
}
