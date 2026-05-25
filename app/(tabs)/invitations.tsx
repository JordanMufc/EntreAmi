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
import { useAuth } from '@/src/context/auth-context';
import { useEvents } from '@/src/context/events-context';
import { InvitationStatus } from '@/src/types/event';

const statusLabels: Record<InvitationStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  declined: 'Refusée',
};

export default function InvitationsScreen() {
  const { user } = useAuth();
  const { createInvitation, events, invitations, updateInvitationStatus } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const activeEventId = selectedEventId || events[0]?.id || '';
  const selectedEvent = events.find((event) => event.id === activeEventId);
  const eventTitleById = useMemo(
    () => new Map(events.map((event) => [event.id, event.title])),
    [events],
  );
  const receivedInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) =>
          invitation.email.toLowerCase() === user?.email.toLowerCase() &&
          invitation.createdBy !== user.id &&
          invitation.status === 'pending',
      ),
    [invitations, user],
  );
  const visibleInvitations = useMemo(
    () =>
      activeEventId
        ? invitations.filter(
            (invitation) => invitation.eventId === activeEventId && invitation.createdBy === user?.id,
          )
        : invitations.filter((invitation) => invitation.createdBy === user?.id),
    [activeEventId, invitations, user],
  );

  const resetForm = () => {
    setName('');
    setEmail('');
  };

  const handleCreateInvitation = async () => {
    if (!activeEventId) {
      Alert.alert('Invitation impossible', 'Créez d’abord un événement.');
      return;
    }

    if (!name.trim() || !email.trim()) {
      Alert.alert('Invitation impossible', 'Renseignez le nom et l’email.');
      return;
    }

    setLoading(true);

    try {
      await createInvitation({ eventId: activeEventId, name, email });
      resetForm();
    } catch (error) {
      Alert.alert('Invitation impossible', error instanceof Error ? error.message : 'Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: InvitationStatus) => {
    try {
      await updateInvitationStatus(id, status);
    } catch (error) {
      Alert.alert('Mise à jour impossible', error instanceof Error ? error.message : 'Réessayez.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackToHomeButton />

      <View style={styles.header}>
        <Text style={styles.title}>Invitations</Text>
        <Text style={styles.subtitle}>
          Répondez aux invitations reçues et suivez celles que vous envoyez.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications reçues</Text>
        <FlatList
          contentContainerStyle={receivedInvitations.length === 0 ? styles.emptyList : styles.list}
          data={receivedInvitations}
          keyExtractor={(invitation) => invitation.id}
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aucune invitation reçue</Text>
              <Text style={styles.cardText}>
                Les invitations à des événements apparaîtront ici.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <View style={styles.invitationIdentity}>
                  <Text style={styles.cardTitle}>
                    {eventTitleById.get(item.eventId) ?? 'Événement'}
                  </Text>
                  <Text style={styles.cardText}>Invitation pour {item.name || item.email}</Text>
                </View>
                <Text style={styles.status}>{statusLabels[item.status]}</Text>
              </View>

              <View style={styles.statusActions}>
                <Pressable
                  onPress={() => handleStatusChange(item.id, 'accepted')}
                  style={({ pressed }) => [
                    styles.statusButton,
                    item.status === 'accepted' && styles.statusButtonActive,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.statusButtonText,
                      item.status === 'accepted' && styles.statusButtonTextActive,
                    ]}>
                    Accepter
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleStatusChange(item.id, 'declined')}
                  style={({ pressed }) => [
                    styles.statusButton,
                    item.status === 'declined' && styles.statusButtonDanger,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.statusButtonText,
                      item.status === 'declined' && styles.statusButtonDangerText,
                    ]}>
                    Refuser
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invitations envoyées</Text>
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
            <Text style={styles.cardText}>
              Créez un événement avant d’ajouter des invitations.
            </Text>
          </View>
        )}
      </View>

      {selectedEvent ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Nouvelle invitation</Text>
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
            onPress={handleCreateInvitation}
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'Invitation...' : 'Ajouter l’invitation'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invités de l’événement</Text>
        <FlatList
          contentContainerStyle={visibleInvitations.length === 0 ? styles.emptyList : styles.list}
          data={visibleInvitations}
          keyExtractor={(invitation) => invitation.id}
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aucune invitation</Text>
              <Text style={styles.cardText}>
                Les invitations ajoutées seront enregistrées en base de données.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <View style={styles.invitationIdentity}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardText}>{item.email}</Text>
                </View>
                <Text style={styles.status}>{statusLabels[item.status]}</Text>
              </View>

              <View style={styles.statusActions}>
                {(['pending', 'accepted', 'declined'] as InvitationStatus[]).map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => handleStatusChange(item.id, status)}
                    style={({ pressed }) => [
                      styles.statusButton,
                      item.status === status && styles.statusButtonActive,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.statusButtonText,
                        item.status === status && styles.statusButtonTextActive,
                      ]}>
                      {statusLabels[status]}
                    </Text>
                  </Pressable>
                ))}
              </View>
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
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
  },
  primaryButtonText: {
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
  invitationCard: {
    gap: 14,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  invitationIdentity: {
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
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#ccd6df',
    borderRadius: 8,
  },
  statusButtonActive: {
    borderColor: '#0a7ea4',
    backgroundColor: '#e8f6fa',
  },
  statusButtonDanger: {
    borderColor: '#b42318',
    backgroundColor: '#fff0ee',
  },
  statusButtonText: {
    fontWeight: '700',
    color: '#52616f',
  },
  statusButtonTextActive: {
    color: '#0a7ea4',
  },
  statusButtonDangerText: {
    color: '#b42318',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
});
