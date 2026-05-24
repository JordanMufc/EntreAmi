import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackToHomeButton } from '@/components/back-to-home-button';
import { useEvents } from '@/src/context/events-context';

const statusLabels = {
  invited: 'Invité',
  accepted: 'Accepté',
} as const;

export default function FriendsScreen() {
  const { createFriend, friends } = useEvents();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const resetForm = () => {
    setName('');
    setEmail('');
  };

  const handleCreateFriend = async () => {
    setMessage('');

    if (!name.trim() || !email.trim()) {
      const validationMessage = 'Renseignez le nom et l’email de votre ami.';
      setMessageType('error');
      setMessage(validationMessage);
      Alert.alert('Invitation impossible', validationMessage);
      return;
    }

    setLoading(true);

    try {
      await createFriend({ name, email });
      resetForm();
      setMessageType('success');
      setMessage('Ami invité et enregistré en base de données.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Réessayez.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Invitation impossible', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackToHomeButton />

      <View style={styles.header}>
        <Text style={styles.title}>Mes amis</Text>
        <Text style={styles.subtitle}>
          Invitez vos amis une fois, puis retrouvez-les pour vos événements et dépenses.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Inviter un ami</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            onChangeText={setName}
            placeholder="Marie Dupont"
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="marie@email.be"
            style={styles.input}
            value={email}
          />
        </View>

        <Pressable
          disabled={loading}
          onPress={handleCreateFriend}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}>
          <Text style={styles.buttonText}>{loading ? 'Invitation...' : 'Inviter l’ami'}</Text>
        </Pressable>

        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.feedback, messageType === 'success' && styles.successFeedback]}>
            {message}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carnet d’amis</Text>
        <FlatList
          contentContainerStyle={friends.length === 0 ? styles.emptyList : styles.list}
          data={friends}
          keyExtractor={(friend) => friend.id}
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aucun ami invité</Text>
              <Text style={styles.cardText}>
                Les amis ajoutés ici seront sauvegardés dans Supabase.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.friendCard}>
              <View style={styles.friendIdentity}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardText}>{item.email}</Text>
              </View>
              <Text style={styles.status}>{statusLabels[item.status]}</Text>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 32,
    backgroundColor: '#f5f7fb',
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  form: {
    gap: 14,
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
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  feedback: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successFeedback: {
    color: '#147d64',
  },
  list: {
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  friendCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  friendIdentity: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  cardText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#52616f',
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
});
