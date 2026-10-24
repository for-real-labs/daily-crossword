import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { GameRepository } from "./repository";
const KEY = "daily-crossword.save.v1",
  LEDGER = "daily-crossword.sequence.v1";
export const repository = new GameRepository({
  read: () => AsyncStorage.getItem(KEY),
  write: (value) => AsyncStorage.setItem(KEY, value),
  readLedger: () =>
    Platform.OS === "web"
      ? AsyncStorage.getItem(LEDGER)
      : SecureStore.getItemAsync(LEDGER),
  writeLedger: (value) =>
    Platform.OS === "web"
      ? AsyncStorage.setItem(LEDGER, value)
      : SecureStore.setItemAsync(LEDGER, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        }),
});
