import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useEvents } from '@/src/context/events-context';

export default function EventsScreen() {
  const { createEvent, events } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !date.trim() || !time.trim() || !location.trim()) {
      Alert.alert(
        'Création impossible',
        'Veuillez renseigner le titre, la date, l’heure et le lieu.',
      );
      return;
    }

    setLoading(true);

    try {
      await createEvent({ title, date, time, location, description });
      resetForm();
      setShowForm(false);
    } catch (error) {
      Alert.alert(
        'Création impossible',
        error instanceof Error ? error.message : 'Réessayez.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Événements</Text>
        <Text style={styles.subtitle}>
          Créez et retrouvez les événements pour lesquels les dépenses seront partagées.
        </Text>
      </View>

      {showForm ? (
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
              onPress={() => {
                resetForm();
                setShowForm(false);
              }}
              style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowForm(true)}
          style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Créer un événement</Text>
        </Pressable>
      )}

      <FlatList
        contentContainerStyle={events.length === 0 ? styles.emptyList : styles.list}
        data={events}
        keyExtractor={(event) => event.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucun événement pour le moment</Text>
            <Text style={styles.emptyText}>
              Créez votre premier événement pour commencer à inviter des participants.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventMeta}>
              {item.date} à {item.time}
            </Text>
            <Text style={styles.eventMeta}>{item.location}</Text>
            {item.description ? (
              <Text style={styles.eventDescription}>{item.description}</Text>
            ) : null}
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 24,
    padding: 24,
    paddingTop: 72,
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
  emptyState: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
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
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  eventCard: {
    gap: 6,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123047',
  },
  eventMeta: {
    fontSize: 15,
    color: '#52616f',
  },
  eventDescription: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#25313b',
  },
});
