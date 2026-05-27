import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/src/presentation/auth/auth-context";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      const message = "Veuillez remplir tous les champs.";
      setErrorMessage(message);
      Alert.alert("Connexion impossible", message);
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Réessayez.";
      setErrorMessage(message);
      Alert.alert("Connexion impossible", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>EntreAmi</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour gérer vos événements.
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="demo@entreami.be"
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="password"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          <Pressable
            disabled={loading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </Pressable>

          {errorMessage ? (
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.link}>Créer un compte</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f7fb",
  },
  card: {
    gap: 20,
    padding: 24,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#123047",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "#52616f",
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25313b",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ccd6df",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#0a7ea4",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  errorText: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    color: "#52616f",
  },
  link: {
    fontWeight: "700",
    color: "#0a7ea4",
  },
});
