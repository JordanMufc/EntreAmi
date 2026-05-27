import { useMemo, useState } from 'react';
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
import { useEvents } from '@/src/presentation/events/events-context';
import { Friend } from '@/src/domain/events/entities';

function getFriendContact(friend: Friend, currentUserId?: string) {
  if (friend.createdBy === currentUserId) {
    return {
      name: friend.name,
      email: friend.email,
    };
  }

  return {
    name: friend.requesterName || 'Ami',
    email: friend.requesterEmail,
  };
}

export default function EventsScreen() {
  const { user } = useAuth();
  const { createEvent, friends } = useEvents();
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);

  const addressBookFriends = useMemo(
    () =>
      friends.filter((friend) => {
        if (friend.createdBy === user?.id) {
          return friend.status === 'accepted';
        }

        return (
          friend.email.toLowerCase() === user?.email.toLowerCase() &&
          friend.status === 'accepted' &&
          Boolean(friend.requesterEmail)
        );
      }),
    [friends, user],
  );

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
    setSelectedFriendIds([]);
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  };

  const handleCreateEvent = async () => {
    setMessage('');

    if (!title.trim() || !date.trim() || !time.trim() || !location.trim()) {
      const validationMessage = 'Veuillez renseigner le titre, la date, l’heure et le lieu.';
      setMessageType('error');
      setMessage(validationMessage);
      Alert.alert('Création impossible', validationMessage);
      return;
    }

    setLoading(true);

    try {
      const invitedFriends = friends
        .filter((friend) => selectedFriendIds.includes(friend.id))
        .map((friend) => getFriendContact(friend, user?.id))
        .filter((friend) => friend.email);

      await createEvent({ title, date, time, location, description, invitedFriends });
      resetForm();
      setMessageType('success');
      setMessage(
        invitedFriends.length > 0
          ? 'Événement enregistré et invitations envoyées.'
          : 'Événement enregistré.',
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Réessayez.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Création impossible', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <BackToHomeButton />

        <View style={styles.header}>
          <Text style={styles.title}>Créer un événement</Text>
          <Text style={styles.subtitle}>
            Ajoutez les informations de base et invitez vos amis directement.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              onChangeText={setTitle}
              placeholder="Week-end à Bruxelles"
              style={styles.input}
              value={title}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                onChangeText={setDate}
                placeholder="2026-06-20"
                style={styles.input}
                value={date}
              />
            </View>

            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Heure</Text>
              <TextInput
                onChangeText={setTime}
                placeholder="18:30"
                style={styles.input}
                value={time}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lieu</Text>
            <TextInput
              onChangeText={setLocation}
              placeholder="Grand-Place"
              style={styles.input}
              value={location}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Informations utiles pour les participants"
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={description}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Inviter des amis</Text>
            {addressBookFriends.length > 0 ? (
              <View style={styles.friendList}>
                {addressBookFriends.map((friend) => {
                  const selected = selectedFriendIds.includes(friend.id);
                  const contact = getFriendContact(friend, user?.id);

                  return (
                    <Pressable
                      key={friend.id}
                      onPress={() => toggleFriend(friend.id)}
                      style={({ pressed }) => [
                        styles.friendRow,
                        selected && styles.friendRowSelected,
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.friendIdentity}>
                        <Text style={styles.friendName}>{contact.name}</Text>
                        <Text style={styles.friendEmail}>{contact.email}</Text>
                      </View>
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected ? <Text style={styles.checkboxMark}>✓</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.helperText}>Ajoutez d’abord des amis depuis l’onglet Mes amis.</Text>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              disabled={loading}
              onPress={handleCreateEvent}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Création...' : 'Enregistrer'}
              </Text>
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={resetForm}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
            </Pressable>
          </View>

          {message ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.feedback, messageType === 'success' && styles.successFeedback]}>
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
  scrollContent: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
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
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  actions: {
    gap: 10,
  },
  friendList: {
    gap: 10,
  },
  friendRow: {
    minHeight: 58,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccd6df',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  friendRowSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#e8f6fa',
  },
  friendIdentity: {
    flex: 1,
    gap: 3,
  },
  friendName: {
    fontWeight: '700',
    color: '#25313b',
  },
  friendEmail: {
    fontSize: 13,
    color: '#52616f',
  },
  checkbox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#9aabba',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#0a7ea4',
  },
  checkboxMark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52616f',
  },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccd6df',
    backgroundColor: '#fff',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#25313b',
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
});
