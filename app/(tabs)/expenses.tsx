import { useMemo, useState } from 'react';
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
import { useEvents } from '@/src/presentation/events/events-context';

function parseParticipants(value: string) {
  return value
    .split(',')
    .map((participant) => participant.trim())
    .filter(Boolean)
    .map((participant) => {
      const [name, email = ''] = participant.split('<').map((part) => part.trim());

      return {
        name: name.replace(/>$/, '').trim(),
        email: email.replace(/>$/, '').trim(),
      };
    });
}

export default function ExpensesScreen() {
  const { createExpense, events, expenses, invitations } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [paidByEmail, setPaidByEmail] = useState('');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState('');
  const [loading, setLoading] = useState(false);

  const activeEventId = selectedEventId || events[0]?.id || '';
  const selectedEvent = events.find((event) => event.id === activeEventId);
  const visibleExpenses = useMemo(
    () => (activeEventId ? expenses.filter((expense) => expense.eventId === activeEventId) : expenses),
    [activeEventId, expenses],
  );
  const suggestedParticipants = invitations
    .filter((invitation) => invitation.eventId === activeEventId)
    .map((invitation) => `${invitation.name}${invitation.email ? ` <${invitation.email}>` : ''}`);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setPaidBy('');
    setPaidByEmail('');
    setDate('');
    setParticipants('');
  };

  const handleCreateExpense = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));
    const parsedParticipants = parseParticipants(participants);

    if (!activeEventId) {
      Alert.alert('Dépense impossible', 'Créez d’abord un événement.');
      return;
    }

    if (!title.trim() || !amount.trim() || !paidBy.trim() || !date.trim()) {
      Alert.alert('Dépense impossible', 'Renseignez le titre, le montant, le payeur et la date.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Dépense impossible', 'Le montant doit être un nombre positif.');
      return;
    }

    if (parsedParticipants.length === 0) {
      Alert.alert('Dépense impossible', 'Ajoutez au moins un participant à partager.');
      return;
    }

    setLoading(true);

    try {
      await createExpense({
        eventId: activeEventId,
        title,
        amount: parsedAmount,
        paidBy,
        paidByEmail,
        date,
        participants: parsedParticipants,
      });
      resetForm();
    } catch (error) {
      Alert.alert('Dépense impossible', error instanceof Error ? error.message : 'Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const fillParticipantsFromInvitations = () => {
    setParticipants(suggestedParticipants.join(', '));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackToHomeButton />

      <View style={styles.header}>
        <Text style={styles.title}>Dépenses</Text>
        <Text style={styles.subtitle}>
          Enregistrez les frais en base de données et indiquez les personnes concernées.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Événement</Text>
        {events.length > 0 ? (
          <View style={styles.eventList}>
            {events.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => setSelectedEventId(event.id)}
                style={({ pressed }) => [
                  styles.eventChip,
                  event.id === activeEventId && styles.eventChipActive,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.eventChipText,
                    event.id === activeEventId && styles.eventChipTextActive,
                  ]}>
                  {event.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aucun événement</Text>
            <Text style={styles.cardText}>Créez un événement avant d’ajouter une dépense.</Text>
          </View>
        )}
      </View>

      {selectedEvent ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Nouvelle dépense</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              onChangeText={setTitle}
              placeholder="Courses du week-end"
              style={styles.input}
              value={title}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Montant</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setAmount}
                placeholder="42.50"
                style={styles.input}
                value={amount}
              />
            </View>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                onChangeText={setDate}
                placeholder="2026-06-20"
                style={styles.input}
                value={date}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Payé par</Text>
              <TextInput
                onChangeText={setPaidBy}
                placeholder="Alex"
                style={styles.input}
                value={paidBy}
              />
            </View>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Email payeur</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setPaidByEmail}
                placeholder="alex@email.be"
                style={styles.input}
                value={paidByEmail}
              />
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Participants</Text>
              {suggestedParticipants.length > 0 ? (
                <Pressable onPress={fillParticipantsFromInvitations}>
                  <Text style={styles.inlineAction}>Utiliser les invités</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              multiline
              onChangeText={setParticipants}
              placeholder="Marie <marie@email.be>, Alex <alex@email.be>"
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={participants}
            />
          </View>

          <Pressable
            disabled={loading}
            onPress={handleCreateExpense}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}>
            <Text style={styles.buttonText}>{loading ? 'Ajout...' : 'Ajouter la dépense'}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dépenses enregistrées</Text>
        <FlatList
          contentContainerStyle={visibleExpenses.length === 0 ? styles.emptyList : styles.list}
          data={visibleExpenses}
          keyExtractor={(expense) => expense.id}
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aucune dépense enregistrée</Text>
              <Text style={styles.cardText}>
                Chaque dépense ajoutée ici est sauvegardée dans Supabase.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseTitleGroup}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardText}>
                    Payé par {item.paidBy} le {item.date}
                  </Text>
                </View>
                <Text style={styles.amount}>{item.amount.toFixed(2)} €</Text>
              </View>
              <Text style={styles.participantsText}>
                Participants: {item.participants.map((participant) => participant.name).join(', ')}
              </Text>
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
  eventList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  eventChipActive: {
    backgroundColor: '#0a7ea4',
  },
  eventChipText: {
    fontWeight: '700',
    color: '#25313b',
  },
  eventChipTextActive: {
    color: '#fff',
  },
  form: {
    gap: 14,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#25313b',
  },
  inlineAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a7ea4',
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
  expenseCard: {
    gap: 12,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  expenseTitleGroup: {
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
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#147d64',
  },
  participantsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52616f',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
});
