import { EventsRepository } from '@/src/domain/events/events-repository';
import {
  BalanceLine,
  CreateEventInput,
  CreateExpenseInput,
  CreateFriendInput,
  CreateInvitationInput,
} from '@/src/domain/events/entities';
import { supabase } from '@/src/lib/supabase';

import {
  EventRow,
  ExpenseParticipantRow,
  ExpenseRow,
  FriendRow,
  getDatabaseErrorMessage,
  InvitationRow,
  isMissingTableError,
  RepaymentRow,
  toEvent,
  toExpense,
  toFriend,
  toInvitation,
  toParticipant,
  toRepayment,
} from './supabase-event-mappers';

async function getCurrentSessionUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.user) {
    throw new Error('Votre session a expiré. Reconnectez-vous avant de continuer.');
  }

  return session.user;
}

function getCurrentUserName(user: Awaited<ReturnType<typeof getCurrentSessionUser>>) {
  return typeof user.user_metadata?.username === 'string'
    ? user.user_metadata.username
    : (user.email?.split('@')[0] ?? 'Utilisateur');
}

async function loadEventsData(): ReturnType<EventsRepository['loadEventsData']> {
  const { data, error } = await supabase
    .from('events')
    .select('id,title,date,time,location,description,creator_name,creator_email,created_by,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(getDatabaseErrorMessage(error.message));
  }

  const events = (data ?? []).map((row) => toEvent(row as EventRow));

  const { data: friendData, error: friendError } = await supabase
    .from('friends')
    .select('id,name,email,requester_name,requester_email,status,created_by,created_at')
    .order('created_at', { ascending: false });

  if (friendError && !isMissingTableError(friendError.message)) {
    throw new Error(getDatabaseErrorMessage(friendError.message));
  }

  const friends = friendError ? [] : (friendData ?? []).map((row) => toFriend(row as FriendRow));

  const { data: invitationData, error: invitationError } = await supabase
    .from('invitations')
    .select('id,event_id,email,name,status,created_by,created_at')
    .order('created_at', { ascending: false });

  if (invitationError) {
    if (isMissingTableError(invitationError.message)) {
      return { events, friends, invitations: [], expenses: [], repayments: [] };
    }

    throw new Error(getDatabaseErrorMessage(invitationError.message));
  }

  const invitations = (invitationData ?? []).map((row) => toInvitation(row as InvitationRow));

  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('id,event_id,title,amount,paid_by,paid_by_email,date,created_by,created_at')
    .order('created_at', { ascending: false });

  if (expenseError) {
    if (isMissingTableError(expenseError.message)) {
      return { events, friends, invitations, expenses: [], repayments: [] };
    }

    throw new Error(getDatabaseErrorMessage(expenseError.message));
  }

  const { data: participantData, error: participantError } = await supabase
    .from('expense_participants')
    .select('id,expense_id,name,email');

  if (participantError) {
    if (isMissingTableError(participantError.message)) {
      return { events, friends, invitations, expenses: [], repayments: [] };
    }

    throw new Error(getDatabaseErrorMessage(participantError.message));
  }

  const participants = (participantData ?? []).map((row) =>
    toParticipant(row as ExpenseParticipantRow),
  );
  const participantsByExpense = new Map<string, ReturnType<typeof toParticipant>[]>();

  for (const participant of participants) {
    const currentParticipants = participantsByExpense.get(participant.expenseId) ?? [];
    currentParticipants.push(participant);
    participantsByExpense.set(participant.expenseId, currentParticipants);
  }

  const expenses = (expenseData ?? []).map((row) =>
    toExpense(row as ExpenseRow, participantsByExpense.get((row as ExpenseRow).id) ?? []),
  );

  const { data: repaymentData, error: repaymentError } = await supabase
    .from('repayments')
    .select('id,event_id,event_title,payer_name,recipient_name,amount,created_by,created_at')
    .order('created_at', { ascending: false });

  if (repaymentError) {
    if (isMissingTableError(repaymentError.message)) {
      return { events, friends, invitations, expenses, repayments: [] };
    }

    throw new Error(getDatabaseErrorMessage(repaymentError.message));
  }

  return {
    events,
    friends,
    invitations,
    expenses,
    repayments: (repaymentData ?? []).map((row) => toRepayment(row as RepaymentRow)),
  };
}

async function createEvent({
  title,
  date,
  time,
  location,
  description,
  invitedFriends = [],
}: CreateEventInput) {
  const user = await getCurrentSessionUser();
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
      description: description.trim(),
      creator_name: getCurrentUserName(user),
      creator_email: (user.email ?? '').trim().toLowerCase(),
      created_by: user.id,
    })
    .select('id,title,date,time,location,description,creator_name,creator_email,created_by,created_at')
    .single();

  if (error) {
    throw new Error(getDatabaseErrorMessage(error.message));
  }

  const event = toEvent(data as EventRow);
  const cleanInvitedFriends = invitedFriends
    .map((friend) => ({
      event_id: event.id,
      email: friend.email.trim().toLowerCase(),
      name: friend.name.trim(),
      created_by: user.id,
    }))
    .filter((friend) => friend.email && friend.name);

  if (cleanInvitedFriends.length === 0) {
    return { event, invitations: [] };
  }

  const { data: invitationData, error: invitationError } = await supabase
    .from('invitations')
    .insert(cleanInvitedFriends)
    .select('id,event_id,email,name,status,created_by,created_at');

  if (invitationError) {
    throw new Error(getDatabaseErrorMessage(invitationError.message));
  }

  return {
    event,
    invitations: (invitationData ?? []).map((row) => toInvitation(row as InvitationRow)),
  };
}

async function createExpense({
  eventId,
  title,
  amount,
  paidBy,
  paidByEmail,
  date,
  participants,
}: CreateExpenseInput) {
  const user = await getCurrentSessionUser();
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

  return toExpense(
    expenseRow,
    (participantData ?? []).map((row) => toParticipant(row as ExpenseParticipantRow)),
  );
}

export const supabaseEventsRepository: EventsRepository = {
  loadEventsData,
  createEvent,
  deleteEvent: async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      throw new Error(getDatabaseErrorMessage(error.message));
    }
  },
  createFriend: async ({ name, email }: CreateFriendInput) => {
    const user = await getCurrentSessionUser();
    const { data, error } = await supabase
      .from('friends')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        requester_name: getCurrentUserName(user),
        requester_email: (user.email ?? '').trim().toLowerCase(),
        created_by: user.id,
      })
      .select('id,name,email,requester_name,requester_email,status,created_by,created_at')
      .single();

    if (error) {
      throw new Error(getDatabaseErrorMessage(error.message));
    }

    return toFriend(data as FriendRow);
  },
  deleteFriend: async (id: string) => {
    const { error } = await supabase.from('friends').delete().eq('id', id);

    if (error) {
      throw new Error(getDatabaseErrorMessage(error.message));
    }
  },
  updateFriendStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('friends')
      .update({ status })
      .eq('id', id)
      .select('id,name,email,requester_name,requester_email,status,created_by,created_at')
      .single();

    if (error) {
      throw new Error(getDatabaseErrorMessage(error.message));
    }

    return toFriend(data as FriendRow);
  },
  createInvitation: async ({ eventId, email, name }: CreateInvitationInput) => {
    const user = await getCurrentSessionUser();
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

    return toInvitation(data as InvitationRow);
  },
  updateInvitationStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', id)
      .select('id,event_id,email,name,status,created_by,created_at')
      .single();

    if (error) {
      throw new Error(getDatabaseErrorMessage(error.message));
    }

    return toInvitation(data as InvitationRow);
  },
  createExpense,
  markBalanceAsRepaid: async (balance: BalanceLine) => {
    const user = await getCurrentSessionUser();
    const { data, error } = await supabase
      .from('repayments')
      .insert({
        event_id: balance.eventId,
        event_title: balance.eventTitle,
        payer_name: balance.from,
        recipient_name: balance.to,
        amount: balance.amount,
        created_by: user.id,
      })
      .select('id,event_id,event_title,payer_name,recipient_name,amount,created_by,created_at')
      .single();

    if (error) {
      throw new Error(getDatabaseErrorMessage(error.message));
    }

    return toRepayment(data as RepaymentRow);
  },
};
