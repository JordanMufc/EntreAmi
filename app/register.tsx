import { Link, router } from 'expo-router';
import { useState } from 'react';
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
} from 'react-native';

import { useAuth } from '@/src/context/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setFeedbackMessage('');

    if (!username.trim() || !email.trim() || !password) {
      const message = 'Veuillez remplir tous les champs.';
      setFeedbackType('error');
      setFeedbackMessage(message);
      Alert.alert('Inscription impossible', message);
      return;
    }

    if (password.length < 6) {
      const message = 'Le mot de passe doit contenir au moins 6 caractères.';
      setFeedbackType('error');
      setFeedbackMessage(message);
      Alert.alert('Inscription impossible', message);
      return;
    }

    setLoading(true);

    try {
      const result = await register({ username, email, password });

      if (result.requiresEmailConfirmation) {
        setFeedbackType('success');
        setFeedbackMessage('Compte créé. Confirmez votre email avant de vous connecter.');
        Alert.alert(
          'Compte créé',
          'Confirmez votre email avant de vous connecter.',
        );
        setTimeout(() => {
          router.replace('/login');
        }, 1200);
        return;
      }

      setFeedbackType('success');
      setFeedbackMessage('Compte créé. Connexion en cours...');
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Réessayez.';
      setFeedbackType('error');
      setFeedbackMessage(message);
      Alert.alert('Inscription impossible', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Renseignez vos informations pour commencer.</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom utilisateur</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setUsername}
              placeholder="Votre nom"
              style={styles.input}
              value={username}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="vous@email.be"
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Minimum 6 caractères"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          <Pressable
            disabled={loading}
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </Pressable>

          {feedbackMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.feedbackText, feedbackType === 'success' && styles.successText]}>
              {feedbackMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.link}>Se connecter</Text>
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
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f7fb',
  },
  card: {
    gap: 20,
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#123047',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#52616f',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#25313b',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#ccd6df',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  feedbackText: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successText: {
    color: '#147d64',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#52616f',
  },
  link: {
    fontWeight: '700',
    color: '#0a7ea4',
  },
});
