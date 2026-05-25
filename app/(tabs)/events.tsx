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
import { useAuth } from '@/src/context/auth-context';
import { useEvents } from '@/src/context/events-context';
import { Friend, Invitation } from '@/src/types/event';

function getAcceptedParticipants(eventId: string, invitations: Invitation[]) {
  return invitations
    .filter((invitation) => invitation.eventId === eventId && invitation.status === 'accepted')
    .map((invitation) => ({ name: invitation.name || invitation.email, email: invitation.email }));
}

function getParticipantKey(participant: { name: string; email: string }) {
  return participant.email.trim().toLowerCase() || participant.name.trim().toLowerCase();
}

function getUniqueParticipants(participants: { name: string; email: string }[]) {
  const uniqueParticipants = new Map<string, { name: string; email: string }>();

  for (const participant of participants) {
    const key = getParticipantKey(participant);

    if (key) {
      uniqueParticipants.set(key, participant);
    }
  }

  return [...uniqueParticipants.values()];
}

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
  const {
    createEvent,
    createExpense,
    createInvitation,
    deleteEvent,
    events,
    expenses,
    friends,
    invitations,
  } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [activeExpenseEventId, setActiveExpenseEventId] = useState('');
  const [activeInviteEventId, setActiveInviteEventId] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseParticipantEmails, setExpenseParticipantEmails] = useState<string[]>([]);
  const [selectedExistingFriendIds, setSelectedExistingFriendIds] = useState<string[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [deletingEventId, setDeletingEventId] = useState('');
  const [pendingDeleteEventId, setPendingDeleteEventId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
    setSelectedFriendIds([]);
  };

  const currentUserParticipant = useMemo(
    () => ({
      name: user?.username ?? 'Moi',
      email: user?.email ?? '',
    }),
    [user],
  );
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
  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        if (event.createdBy === user?.id) {
          return true;
        }

        return invitations.some(
          (invitation) =>
            invitation.eventId === event.id &&
            invitation.status === 'accepted' &&
            invitation.email.toLowerCase() === user?.email.toLowerCase(),
        );
      }),
    [events, invitations, user],
  );

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  };

  const toggleExistingFriend = (id: string) => {
    setSelectedExistingFriendIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  };

  const getAvailableFriendsForEvent = (eventId: string) => {
    const invitedEmails = new Set(
      invitations
        .filter((invitation) => invitation.eventId === eventId)
        .map((invitation) => invitation.email.toLowerCase()),
    );

    if (user?.email) {
      invitedEmails.add(user.email.toLowerCase());
    }

    return addressBookFriends.filter((friend) => {
      const contact = getFriendContact(friend, user?.id);

      return contact.email && !invitedEmails.has(contact.email.toLowerCase());
    });
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
      setShowForm(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Réessayez.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Création impossible', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openInviteForm = (eventId: string) => {
    setActiveInviteEventId(eventId);
    setSelectedExistingFriendIds([]);
  };

  const closeInviteForm = () => {
    setActiveInviteEventId('');
    setSelectedExistingFriendIds([]);
  };

  const handleInviteFriendsToEvent = async (eventId: string) => {
    const friendsToInvite = getAvailableFriendsForEvent(eventId)
      .filter((friend) => selectedExistingFriendIds.includes(friend.id))
      .map((friend) => getFriendContact(friend, user?.id))
      .filter((friend) => friend.email);

    if (friendsToInvite.length === 0) {
      Alert.alert('Invitation impossible', 'Sélectionnez au moins un ami à inviter.');
      return;
    }

    setLoading(true);

    try {
      for (const friend of friendsToInvite) {
        await createInvitation({
          eventId,
          name: friend.name,
          email: friend.email,
        });
      }

      closeInviteForm();
      setMessageType('success');
      setMessage(
        friendsToInvite.length > 1
          ? 'Amis invités à l’événement.'
          : 'Ami invité à l’événement.',
      );
    } catch (error) {
      Alert.alert('Invitation impossible', error instanceof Error ? error.message : 'Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseTitle('');
    setExpenseAmount('');
    setExpensePaidBy('');
    setExpenseDate('');
    setExpenseParticipantEmails([]);
  };

  const openExpenseForm = (eventId: string) => {
    const participants = getUniqueParticipants([
      currentUserParticipant,
      ...getAcceptedParticipants(eventId, invitations),
    ]);

    setActiveExpenseEventId(eventId);
    setExpensePaidBy(currentUserParticipant.email);
    setExpenseParticipantEmails(participants.map((participant) => participant.email));
  };

  const toggleExpenseParticipant = (email: string) => {
    setExpenseParticipantEmails((currentEmails) =>
      currentEmails.includes(email)
        ? currentEmails.filter((currentEmail) => currentEmail !== email)
        : [...currentEmails, email],
    );
  };

  const handleCreateExpense = async (eventId: string) => {
    const amount = Number(expenseAmount.replace(',', '.'));
    const participants = getUniqueParticipants([
      currentUserParticipant,
      ...getAcceptedParticipants(eventId, invitations),
    ]);
    const payer = participants.find((participant) => participant.email === expensePaidBy);
    const selectedParticipants = participants.filter((participant) =>
      expenseParticipantEmails.includes(participant.email),
    );

    if (!expenseTitle.trim() || !expenseAmount.trim() || !expenseDate.trim() || !payer) {
      Alert.alert('Dépense impossible', 'Renseignez le titre, le montant, le payeur et la date.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Dépense impossible', 'Le montant doit être un nombre positif.');
      return;
    }

    if (selectedParticipants.length === 0) {
      Alert.alert('Dépense impossible', 'Sélectionnez au moins un participant concerné.');
      return;
    }

    setLoading(true);

    try {
      await createExpense({
        eventId,
        title: expenseTitle,
        amount,
        paidBy: payer.name,
        paidByEmail: payer.email,
        date: expenseDate,
        participants: selectedParticipants,
      });
      resetExpenseForm();
      setActiveExpenseEventId('');
      setMessageType('success');
      setMessage('Dépense ajoutée à l’événement.');
    } catch (error) {
      Alert.alert('Dépense impossible', error instanceof Error ? error.message : 'Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEventId(eventId);
    setMessage('');

    try {
      await deleteEvent(eventId);
      setPendingDeleteEventId('');
      setMessageType('success');
      setMessage('Événement supprimé.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Réessayez.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Suppression impossible', errorMessage);
    } finally {
      setDeletingEventId('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <BackToHomeButton />

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
                          styles.friendChip,
                          selected && styles.friendChipSelected,
                          pressed && styles.pressed,
                        ]}>
                        <Text
                          style={[
                            styles.friendChipText,
                            selected && styles.friendChipTextSelected,
                          ]}>
                          {contact.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.helperText}>
                  Ajoutez d’abord des amis depuis l’onglet Mes amis.
                </Text>
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
                onPress={() => {
                  resetForm();
                  setShowForm(false);
                }}
                style={({ pressed }) => [
                  styles.button,
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.secondaryButtonText}>Annuler</Text>
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
        ) : (
          <View style={styles.createBlock}>
            <Pressable
              onPress={() => {
                setMessage('');
                setShowForm(true);
              }}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryButtonText}>Créer un événement</Text>
            </Pressable>
            {message ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.feedback, messageType === 'success' && styles.successFeedback]}>
                {message}
              </Text>
            ) : null}
          </View>
        )}

        {visibleEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucun événement pour le moment</Text>
            <Text style={styles.emptyText}>
              Créez votre premier événement pour commencer à inviter des participants.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleEvents.map((item) => (
              <View key={item.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventHeaderText}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventMeta}>
                      {item.date} à {item.time}
                    </Text>
                  </View>
                  {item.createdBy === user?.id ? (
                    <View style={styles.deleteActions}>
                      <Pressable
                        accessibilityLabel={`Supprimer ${item.title}`}
                        disabled={deletingEventId === item.id}
                        onPress={() => {
                          if (pendingDeleteEventId === item.id) {
                            void handleDeleteEvent(item.id);
                            return;
                          }

                          setPendingDeleteEventId(item.id);
                        }}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pendingDeleteEventId === item.id && styles.deleteButtonConfirm,
                          pressed && styles.pressed,
                          deletingEventId === item.id && styles.disabled,
                        ]}>
                        <Text
                          style={[
                            styles.deleteButtonText,
                            pendingDeleteEventId === item.id && styles.deleteButtonConfirmText,
                          ]}>
                          {deletingEventId === item.id
                            ? 'Suppression...'
                            : pendingDeleteEventId === item.id
                              ? 'Confirmer'
                              : 'Supprimer'}
                        </Text>
                      </Pressable>

                      {pendingDeleteEventId === item.id ? (
                        <Pressable
                          onPress={() => setPendingDeleteEventId('')}
                          style={({ pressed }) => [
                            styles.cancelDeleteButton,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.cancelDeleteButtonText}>Annuler</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <Text style={styles.eventMeta}>{item.location}</Text>
                {item.description ? (
                  <Text style={styles.eventDescription}>{item.description}</Text>
                ) : null}

                <View style={styles.eventSection}>
                  <Text style={styles.eventSectionTitle}>Participants acceptés</Text>
                  <View style={styles.participantList}>
                    {getUniqueParticipants([
                      currentUserParticipant,
                      ...getAcceptedParticipants(item.id, invitations),
                    ]).map((participant) => (
                        <Text key={participant.email} style={styles.participantChip}>
                          {participant.name}
                        </Text>
                      ))}
                  </View>
                </View>

                {item.createdBy === user?.id ? (
                  <View style={styles.eventSection}>
                    <Text style={styles.eventSectionTitle}>Inviter un ami oublié</Text>
                    {activeInviteEventId === item.id ? (
                      <View style={styles.inviteForm}>
                        {getAvailableFriendsForEvent(item.id).length > 0 ? (
                          <View style={styles.friendList}>
                            {getAvailableFriendsForEvent(item.id).map((friend) => {
                              const contact = getFriendContact(friend, user?.id);
                              const selected = selectedExistingFriendIds.includes(friend.id);

                              return (
                                <Pressable
                                  key={friend.id}
                                  onPress={() => toggleExistingFriend(friend.id)}
                                  style={({ pressed }) => [
                                    styles.friendChip,
                                    selected && styles.friendChipSelected,
                                    pressed && styles.pressed,
                                  ]}>
                                  <Text
                                    style={[
                                      styles.friendChipText,
                                      selected && styles.friendChipTextSelected,
                                    ]}>
                                    {contact.name}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.helperText}>
                            Tous vos amis acceptés sont déjà invités à cet événement.
                          </Text>
                        )}

                        <View style={styles.actions}>
                          <Pressable
                            disabled={loading || getAvailableFriendsForEvent(item.id).length === 0}
                            onPress={() => handleInviteFriendsToEvent(item.id)}
                            style={({ pressed }) => [
                              styles.button,
                              styles.primaryButton,
                              pressed && styles.pressed,
                              loading && styles.disabled,
                              getAvailableFriendsForEvent(item.id).length === 0 && styles.disabled,
                            ]}>
                            <Text style={styles.primaryButtonText}>
                              {loading ? 'Invitation...' : 'Envoyer l’invitation'}
                            </Text>
                          </Pressable>

                          <Pressable
                            disabled={loading}
                            onPress={closeInviteForm}
                            style={({ pressed }) => [
                              styles.button,
                              styles.secondaryButton,
                              pressed && styles.pressed,
                            ]}>
                            <Text style={styles.secondaryButtonText}>Annuler</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => openInviteForm(item.id)}
                        style={({ pressed }) => [
                          styles.button,
                          styles.secondaryButton,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={styles.secondaryButtonText}>Inviter un ami</Text>
                      </Pressable>
                    )}
                  </View>
                ) : null}

                <View style={styles.eventSection}>
                  <Text style={styles.eventSectionTitle}>Dépenses de l’événement</Text>
                  {expenses.filter((expense) => expense.eventId === item.id).length > 0 ? (
                    <View style={styles.expenseList}>
                      {expenses
                        .filter((expense) => expense.eventId === item.id)
                        .map((expense) => (
                          <View key={expense.id} style={styles.expenseItem}>
                            <View style={styles.expenseInfo}>
                              <Text style={styles.expenseTitle}>{expense.title}</Text>
                              <Text style={styles.expenseMeta}>
                                Payé par {expense.paidBy} le {expense.date}
                              </Text>
                            </View>
                            <Text style={styles.expenseAmount}>{expense.amount.toFixed(2)} €</Text>
                          </View>
                        ))}
                    </View>
                  ) : (
                    <Text style={styles.helperText}>
                      Aucune dépense enregistrée pour cet événement.
                    </Text>
                  )}
                </View>

                {activeExpenseEventId === item.id ? (
                  <View style={styles.expenseForm}>
                    <View style={styles.field}>
                      <Text style={styles.label}>Quoi ?</Text>
                      <TextInput
                        onChangeText={setExpenseTitle}
                        placeholder="Restaurant"
                        style={styles.input}
                        value={expenseTitle}
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.field, styles.rowField]}>
                        <Text style={styles.label}>Montant</Text>
                        <TextInput
                          keyboardType="decimal-pad"
                          onChangeText={setExpenseAmount}
                          placeholder="45.00"
                          style={styles.input}
                          value={expenseAmount}
                        />
                      </View>

                      <View style={[styles.field, styles.rowField]}>
                        <Text style={styles.label}>Date</Text>
                        <TextInput
                          onChangeText={setExpenseDate}
                          placeholder="2026-06-20"
                          style={styles.input}
                          value={expenseDate}
                        />
                      </View>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Qui a payé ?</Text>
                      <View style={styles.friendList}>
                        {getUniqueParticipants([
                          currentUserParticipant,
                          ...getAcceptedParticipants(item.id, invitations),
                        ]).map((participant) => {
                          const selected = expensePaidBy === participant.email;

                          return (
                            <Pressable
                              key={participant.email}
                              onPress={() => setExpensePaidBy(participant.email)}
                              style={({ pressed }) => [
                                styles.friendChip,
                                selected && styles.friendChipSelected,
                                pressed && styles.pressed,
                              ]}>
                              <Text
                                style={[
                                  styles.friendChipText,
                                  selected && styles.friendChipTextSelected,
                                ]}>
                                {participant.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Pour qui ?</Text>
                      <View style={styles.friendList}>
                        {getUniqueParticipants([
                          currentUserParticipant,
                          ...getAcceptedParticipants(item.id, invitations),
                        ]).map((participant) => {
                          const selected = expenseParticipantEmails.includes(participant.email);

                          return (
                            <Pressable
                              key={participant.email}
                              onPress={() => toggleExpenseParticipant(participant.email)}
                              style={({ pressed }) => [
                                styles.friendChip,
                                selected && styles.friendChipSelected,
                                pressed && styles.pressed,
                              ]}>
                              <Text
                                style={[
                                  styles.friendChipText,
                                  selected && styles.friendChipTextSelected,
                                ]}>
                                {participant.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        disabled={loading}
                        onPress={() => handleCreateExpense(item.id)}
                        style={({ pressed }) => [
                          styles.button,
                          styles.primaryButton,
                          pressed && styles.pressed,
                          loading && styles.disabled,
                        ]}>
                        <Text style={styles.primaryButtonText}>
                          {loading ? 'Ajout...' : 'Ajouter la dépense'}
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={loading}
                        onPress={() => {
                          resetExpenseForm();
                          setActiveExpenseEventId('');
                        }}
                        style={({ pressed }) => [
                          styles.button,
                          styles.secondaryButton,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={styles.secondaryButtonText}>Annuler</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => openExpenseForm(item.id)}
                    style={({ pressed }) => [
                      styles.button,
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.secondaryButtonText}>Ajouter qui a payé quoi</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
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
  friendList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  friendChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#ccd6df',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  friendChipSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#e8f6fa',
  },
  friendChipText: {
    fontWeight: '700',
    color: '#52616f',
  },
  friendChipTextSelected: {
    color: '#0a7ea4',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52616f',
  },
  createBlock: {
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
    paddingBottom: 24,
  },
  eventCard: {
    gap: 14,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  eventHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  eventHeaderText: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123047',
  },
  deleteActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1b8b2',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff5f4',
  },
  deleteButtonConfirm: {
    borderColor: '#b42318',
    backgroundColor: '#b42318',
  },
  deleteButtonText: {
    fontSize: 14,
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
  eventSection: {
    gap: 8,
  },
  eventSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25313b',
  },
  participantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#e8f6fa',
    color: '#0a7ea4',
    fontWeight: '700',
  },
  expenseList: {
    gap: 8,
  },
  expenseItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f7fb',
  },
  expenseInfo: {
    flex: 1,
    gap: 3,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25313b',
  },
  expenseMeta: {
    fontSize: 13,
    color: '#52616f',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#147d64',
  },
  expenseForm: {
    gap: 14,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f7fb',
  },
  inviteForm: {
    gap: 14,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f7fb',
  },
});
