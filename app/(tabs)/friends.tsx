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
import { Friend, FriendStatus } from '@/src/types/event';

const statusLabels = {
  invited: 'Invité',
  accepted: 'Accepté',
  declined: 'Refusé',
} as const;

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

export default function FriendsScreen() {
  const { user } = useAuth();
  const { createFriend, deleteFriend, friends, onlineFriendEmails, updateFriendStatus } =
    useEvents();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingFriendId, setDeletingFriendId] = useState('');
  const [pendingDeleteFriendId, setPendingDeleteFriendId] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const resetForm = () => {
    setName('');
    setEmail('');
  };

  const receivedRequests = useMemo(
    () =>
      friends.filter(
        (friend) =>
          friend.email.toLowerCase() === user?.email.toLowerCase() && friend.createdBy !== user.id,
      ).filter(
        (friend) => friend.status === 'invited',
      ),
    [friends, user],
  );
  const addressBookFriends = useMemo(
    () =>
      friends.filter((friend) => {
        if (friend.createdBy === user?.id) {
          return friend.status !== 'declined';
        }

        return (
          friend.email.toLowerCase() === user?.email.toLowerCase() &&
          friend.status === 'accepted'
        );
      }),
    [friends, user],
  );

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

  const handleStatusChange = async (id: string, status: FriendStatus) => {
    try {
      await updateFriendStatus(id, status);
    } catch (error) {
      Alert.alert('Mise à jour impossible', error instanceof Error ? error.message : 'Réessayez.');
    }
  };

  const handleDeleteFriend = async (id: string) => {
    setDeletingFriendId(id);
    setMessage('');

    try {
      await deleteFriend(id);
      setPendingDeleteFriendId('');
      setMessageType('success');
      setMessage('Ami supprimé du carnet.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Réessayez.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Suppression impossible', errorMessage);
    } finally {
      setDeletingFriendId('');
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
        <Text style={styles.sectionTitle}>Demandes reçues</Text>
        <FlatList
          contentContainerStyle={receivedRequests.length === 0 ? styles.emptyList : styles.list}
          data={receivedRequests}
          keyExtractor={(friend) => friend.id}
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aucune demande reçue</Text>
              <Text style={styles.cardText}>
                Les demandes d’ami envoyées à votre email apparaîtront ici.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.friendCardHeader}>
                <View style={styles.friendIdentity}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {onlineFriendEmails.includes(item.email.toLowerCase()) ? (
                      <View accessibilityLabel="En ligne" style={styles.onlineDot} />
                    ) : null}
                  </View>
                  <Text style={styles.cardText}>Vous a envoyé une demande d’ami.</Text>
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
        <Text style={styles.sectionTitle}>Carnet d’amis</Text>
        <FlatList
          contentContainerStyle={addressBookFriends.length === 0 ? styles.emptyList : styles.list}
          data={addressBookFriends}
          keyExtractor={(friend) => friend.id}
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aucun ami invité</Text>
              <Text style={styles.cardText}>
                Les amis ajoutés ici seront sauvegardés dans Supabase.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const contact = getFriendContact(item, user?.id);
            const isConfirmingDelete = pendingDeleteFriendId === item.id;
            const isDeleting = deletingFriendId === item.id;

            return (
              <View style={styles.friendCard}>
                <View style={styles.friendIdentity}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardTitle}>{contact.name}</Text>
                    {contact.email && onlineFriendEmails.includes(contact.email.toLowerCase()) ? (
                      <View accessibilityLabel="En ligne" style={styles.onlineDot} />
                    ) : null}
                  </View>
                  <Text style={styles.cardText}>{contact.email || 'Email non disponible'}</Text>
                </View>
                <View style={styles.friendCardActions}>
                  <Text style={styles.status}>{statusLabels[item.status]}</Text>
                  <Pressable
                    accessibilityLabel={`Supprimer ${contact.name}`}
                    disabled={isDeleting}
                    onPress={() => {
                      if (isConfirmingDelete) {
                        void handleDeleteFriend(item.id);
                        return;
                      }

                      setPendingDeleteFriendId(item.id);
                    }}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      isConfirmingDelete && styles.deleteButtonConfirm,
                      pressed && styles.pressed,
                      isDeleting && styles.disabled,
                    ]}>
                    <Text
                      style={[
                        styles.deleteButtonText,
                        isConfirmingDelete && styles.deleteButtonConfirmText,
                      ]}>
                      {isDeleting ? 'Suppression...' : isConfirmingDelete ? 'Confirmer' : 'Supprimer'}
                    </Text>
                  </Pressable>
                  {isConfirmingDelete ? (
                    <Pressable
                      onPress={() => setPendingDeleteFriendId('')}
                      style={({ pressed }) => [styles.cancelDeleteButton, pressed && styles.pressed]}>
                      <Text style={styles.cancelDeleteButtonText}>Annuler</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  requestCard: {
    gap: 14,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  friendCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  friendIdentity: {
    flex: 1,
    gap: 4,
  },
  friendCardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1fa463',
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
  deleteButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1b8b2',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff5f4',
  },
  deleteButtonConfirm: {
    borderColor: '#b42318',
    backgroundColor: '#b42318',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b42318',
  },
  deleteButtonConfirmText: {
    color: '#fff',
  },
  cancelDeleteButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelDeleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52616f',
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
