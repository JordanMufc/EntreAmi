import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Les variables Supabase sont manquantes dans .env.local.");
}

const canPersistAuthSession = Platform.OS !== "web" || typeof window !== "undefined";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: canPersistAuthSession ? AsyncStorage : undefined,
    autoRefreshToken: canPersistAuthSession,
    persistSession: canPersistAuthSession,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
