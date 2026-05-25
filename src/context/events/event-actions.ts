import { Dispatch, SetStateAction } from 'react';

import { supabase } from '@/src/lib/supabase';
import { AuthUser } from '@/src/types/auth';
import {
  CreateEventInput,
  CreateExpenseInput,
  CreateFriendInput,
  CreateInvitationInput,
  Event,
  Expense,
  Friend,
  FriendStatus,
  Invitation,
  InvitationStatus,
} from '@/src/types/event';

import {
  EventRow,
  ExpenseParticipantRow,
  ExpenseRow,
  FriendRow,
  getDatabaseErrorMessage,
  InvitationRow,
  toEvent,
  toExpense,
  toFriend,
  toInvitation,
  toParticipant,
} from './database';

interface EventActionParams {
  user: AuthUser | null;
  setEvents: Dispatch<SetStateAction<Event[]>>;
  setFriends: Dispatch<SetStateAction<Friend[]>>;
  setInvitations: Dispatch<SetStateAction<Invitation[]>>;
  setExpenses: Dispatch<SetStateAction<Expense[]>>;
}

export function createEventActions({
  user,
  setEvents,
  setFriends,
  setInvitations,
  setExpenses,
}: EventActionParams) {
  return {
    createEvent: async ({
      title,
      date,
      time,
      location,
      description,
      invitedFriends = [],
    }: CreateEventInput) => {
      if (!user) {
        throw new Error('Vous devez être connecté pour créer un événement.');
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.user) {
        throw new Error('Votre session a expiré. Reconnectez-vous avant de créer un événement.');
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: title.trim(),
          date: date.trim(),
          time: time.trim(),
          location: location.trim(),
          description: description.trim(),
          creator_name: user.username.trim(),
          creator_email: user.email.trim().toLowerCase(),
          created_by: session.user.id,
        })
        .select('id,title,date,time,location,description,creator_name,creator_email,created_by,created_at')
        .single();

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      const newEvent = toEvent(data as EventRow);

      setEvents((currentEvents) => [newEvent, ...currentEvents]);

      const cleanInvitedFriends = invitedFriends
        .map((friend) => ({
          event_id: newEvent.id,
          email: friend.email.trim().toLowerCase(),
          name: friend.name.trim(),
          created_by: session.user.id,
        }))
        .filter((friend) => friend.email && friend.name);

      if (cleanInvitedFriends.length === 0) {
        return;
      }

      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .insert(cleanInvitedFriends)
        .select('id,event_id,email,name,status,created_by,created_at');

      if (invitationError) {
        throw new Error(getDatabaseErrorMessage(invitationError.message));
      }

      setInvitations((currentInvitations) => [
        ...(invitationData ?? []).map((row) => toInvitation(row as InvitationRow)),
        ...currentInvitations,
      ]);
    },
    deleteEvent: async (id: string) => {
      if (!user) {
        throw new Error('Vous devez être connecté pour supprimer un événement.');
      }

      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id));
      setInvitations((currentInvitations) =>
        currentInvitations.filter((invitation) => invitation.eventId !== id),
      );
      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.eventId !== id),
      );
    },
    createFriend: async ({ name, email }: CreateFriendInput) => {
      if (!user) {
        throw new Error('Vous devez être connecté pour inviter un ami.');
      }

      const { data, error } = await supabase
        .from('friends')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          requester_name: user.username.trim(),
          requester_email: user.email.trim().toLowerCase(),
          created_by: user.id,
        })
        .select('id,name,email,requester_name,requester_email,status,created_by,created_at')
        .single();

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      setFriends((currentFriends) => [toFriend(data as FriendRow), ...currentFriends]);
    },
    deleteFriend: async (id: string) => {
      if (!user) {
        throw new Error('Vous devez être connecté pour supprimer un ami.');
      }

      const { error } = await supabase.from('friends').delete().eq('id', id);

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      setFriends((currentFriends) => currentFriends.filter((friend) => friend.id !== id));
    },
    updateFriendStatus: async (id: string, status: FriendStatus) => {
      const { data, error } = await supabase
        .from('friends')
        .update({ status })
        .eq('id', id)
        .select('id,name,email,requester_name,requester_email,status,created_by,created_at')
        .single();

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      const updatedFriend = toFriend(data as FriendRow);

      setFriends((currentFriends) =>
        currentFriends.map((friend) => (friend.id === id ? updatedFriend : friend)),
      );
    },
    createInvitation: async ({ eventId, email, name }: CreateInvitationInput) => {
      if (!user) {
        throw new Error('Vous devez être connecté pour inviter un participant.');
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          event_id: eventId,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          created_by: user.id,
        })
        .select('id,event_id,email,name,status,created_by,created_at')
        .single();

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      setInvitations((currentInvitations) => [
        toInvitation(data as InvitationRow),
        ...currentInvitations,
      ]);
    },
    updateInvitationStatus: async (id: string, status: InvitationStatus) => {
      const { data, error } = await supabase
        .from('invitations')
        .update({ status })
        .eq('id', id)
        .select('id,event_id,email,name,status,created_by,created_at')
        .single();

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      const updatedInvitation = toInvitation(data as InvitationRow);

      setInvitations((currentInvitations) =>
        currentInvitations.map((invitation) =>
          invitation.id === id ? updatedInvitation : invitation,
        ),
      );
    },
    createExpense: async ({
      eventId,
      title,
      amount,
      paidBy,
      paidByEmail,
      date,
      participants,
    }: CreateExpenseInput) => {
      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter une dépense.');
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          event_id: eventId,
          title: title.trim(),
          amount,
          paid_by: paidBy.trim(),
          paid_by_email: paidByEmail.trim().toLowerCase(),
          date: date.trim(),
          created_by: user.id,
        })
        .select('id,event_id,title,amount,paid_by,paid_by_email,date,created_by,created_at')
        .single();

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      const expenseRow = data as ExpenseRow;
      const cleanParticipants = participants.map((participant) => ({
        expense_id: expenseRow.id,
        name: participant.name.trim(),
        email: participant.email.trim().toLowerCase(),
      }));

      const { data: participantData, error: participantError } = await supabase
        .from('expense_participants')
        .insert(cleanParticipants)
        .select('id,expense_id,name,email');

      if (participantError) {
        throw new Error(getDatabaseErrorMessage(participantError.message));
      }

      const nextParticipants = (participantData ?? []).map((row) =>
        toParticipant(row as ExpenseParticipantRow),
      );

      setExpenses((currentExpenses) => [
        toExpense(expenseRow, nextParticipants),
        ...currentExpenses,
      ]);
    },
  };
}
