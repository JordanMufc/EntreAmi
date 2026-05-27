import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackToHomeButton } from '@/components/back-to-home-button';
import { useAuth } from '@/src/presentation/auth/auth-context';

export default function ProfileScreen() {
  const { updateProfile, user } = useAuth();
  const [username, setUsername] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('success');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? '');
    setBankAccount(user?.bankAccount ?? '');
  }, [user]);

  const handleSave = async () => {
    setMessage('');

    if (!username.trim()) {
      const validationMessage = 'Renseignez votre nom.';
      setMessageType('error');
      setMessage(validationMessage);
      Alert.alert('Profil incomplet', validationMessage);
      return;
    }

    setLoading(true);

    try {
      await updateProfile({ username, bankAccount });
      setMessageType('success');
      setMessage('Profil mis à jour.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Réessayez.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Mise à jour impossible', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackToHomeButton />

        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>Modifiez votre nom et votre compte bancaire.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom</Text>
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
            <TextInput editable={false} style={[styles.input, styles.disabledInput]} value={user?.email ?? ''} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Numéro de compte bancaire</Text>
            <TextInput
              autoCapitalize="characters"
              onChangeText={setBankAccount}
              placeholder="BE00 0000 0000 0000"
              style={styles.input}
              value={bankAccount}
            />
          </View>

          <Pressable
            disabled={loading}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}>
            <Text style={styles.buttonText}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Text>
          </Pressable>

          {message ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.feedback, messageType === 'error' && styles.errorFeedback]}>
              {message}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    gap: 24,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 36,
  },
  header: {
    gap: 8,
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
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
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
  disabledInput: {
    color: '#52616f',
    backgroundColor: '#f5f7fb',
  },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  feedback: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#147d64',
  },
  errorFeedback: {
    color: '#b42318',
  },
});
