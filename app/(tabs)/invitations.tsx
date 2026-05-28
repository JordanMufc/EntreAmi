import { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackToHomeButton } from '@/components/back-to-home-button';
import { useAuth } from '@/src/presentation/auth/auth-context';
import { useEvents } from '@/src/presentation/events/events-context';
import { useEventsRefreshControl } from '@/src/presentation/events/use-events-refresh-control';
import { InvitationStatus } from '@/src/domain/events/entities';

const statusLabels: Record<InvitationStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  declined: 'Refusée',
};

export default function InvitationsScreen() {
  const { user } = useAuth();
  const { events, invitations, updateInvitationStatus } = useEvents();
  const refreshControl = useEventsRefreshControl();
  const eventTitleById = useMemo(
    () => new Map(events.map((event) => [event.id, event.title])),
    [events],
  );
  const receivedInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) =>
          invitation.email.toLowerCase() === user?.email.toLowerCase() &&
          invitation.createdBy !== user.id,
      ),
    [invitations, user],
  );

  const handleStatusChange = async (id: string, status: InvitationStatus) => {
    try {
      await updateInvitationStatus(id, status);
    } catch (error) {
      Alert.alert('Mise à jour impossible', error instanceof Error ? error.message : 'Réessayez.');
    }
  };

  return (
    <View style={styles.container}>
      <BackToHomeButton />

      <View style={styles.header}>
        <Text style={styles.title}>Invitations</Text>
        <Text style={styles.subtitle}>Répondez aux invitations reçues.</Text>
      </View>

      <FlatList
        contentContainerStyle={receivedInvitations.length === 0 ? styles.emptyList : styles.list}
        data={receivedInvitations}
        keyExtractor={(invitation) => invitation.id}
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aucune invitation reçue</Text>
            <Text style={styles.cardText}>Les invitations à des événements apparaîtront ici.</Text>
          </View>
        }
        refreshControl={refreshControl}
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
      />
    </View>
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
  list: {
    gap: 12,
    paddingBottom: 32,
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
});
