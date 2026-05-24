import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/src/context/auth-context';
import { supabase } from '@/src/lib/supabase';
import {
  BalanceLine,
  CreateEventInput,
  CreateExpenseInput,
  CreateFriendInput,
  CreateInvitationInput,
  Event,
  Expense,
  ExpenseParticipant,
  Friend,
  FriendStatus,
  Invitation,
  InvitationStatus,
} from '@/src/types/event';

interface EventsContextValue {
  events: Event[];
  friends: Friend[];
  invitations: Invitation[];
  expenses: Expense[];
  balances: BalanceLine[];
  loading: boolean;
  createEvent: (input: CreateEventInput) => Promise<void>;
  createFriend: (input: CreateFriendInput) => Promise<void>;
  createInvitation: (input: CreateInvitationInput) => Promise<void>;
  updateInvitationStatus: (id: string, status: InvitationStatus) => Promise<void>;
  createExpense: (input: CreateExpenseInput) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

interface EventRow {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface FriendRow {
  id: string;
  name: string;
  email: string;
  status: FriendStatus;
  created_by: string;
  created_at: string;
}

interface InvitationRow {
  id: string;
  event_id: string;
  email: string;
  name: string | null;
  status: InvitationStatus;
  created_by: string;
  created_at: string;
}

interface ExpenseRow {
  id: string;
  event_id: string;
  title: string;
  amount: number | string;
  paid_by: string;
  paid_by_email: string | null;
  date: string;
  created_by: string;
  created_at: string;
}

interface ExpenseParticipantRow {
  id: string;
  expense_id: string;
  name: string;
  email: string | null;
}

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    location: row.location,
    description: row.description ?? '',
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    eventId: row.event_id,
    email: row.email,
    name: row.name ?? '',
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toExpense(row: ExpenseRow, participants: ExpenseParticipant[]): Expense {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    amount: Number(row.amount),
    paidBy: row.paid_by,
    paidByEmail: row.paid_by_email ?? '',
    date: row.date,
    participants,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toParticipant(row: ExpenseParticipantRow): ExpenseParticipant {
  return {
    id: row.id,
    expenseId: row.expense_id,
    name: row.name,
    email: row.email ?? '',
  };
}

function isMissingTableError(message: string) {
  return message.includes("Could not find the table") || message.includes("does not exist");
}

function getDatabaseErrorMessage(message: string) {
  if (isMissingTableError(message)) {
    return "La table Supabase est manquante. Exécutez le fichier supabase/schema.sql dans le SQL Editor de Supabase.";
  }

  if (message.toLowerCase().includes("row-level security")) {
    return "Supabase a refusé l’écriture. Vérifiez que les policies RLS du fichier supabase/schema.sql sont bien appliquées.";
  }

  return message;
}

function calculateBalances(events: Event[], expenses: Expense[]): BalanceLine[] {
  const eventTitleById = new Map(events.map((event) => [event.id, event.title]));
  const totalsByEvent = new Map<string, Map<string, number>>();

  for (const expense of expenses) {
    const participants =
      expense.participants.length > 0
        ? expense.participants
        : [{ id: 'payer', expenseId: expense.id, name: expense.paidBy, email: expense.paidByEmail }];
    const share = expense.amount / participants.length;
    const totals = totalsByEvent.get(expense.eventId) ?? new Map<string, number>();

    totals.set(expense.paidBy, (totals.get(expense.paidBy) ?? 0) + expense.amount);

    for (const participant of participants) {
      totals.set(participant.name, (totals.get(participant.name) ?? 0) - share);
    }

    totalsByEvent.set(expense.eventId, totals);
  }

  const balances: BalanceLine[] = [];

  for (const [eventId, totals] of totalsByEvent) {
    const debtors = [...totals.entries()]
      .filter(([, amount]) => amount < -0.005)
      .map(([name, amount]) => ({ name, amount: -amount }));
    const creditors = [...totals.entries()]
      .filter(([, amount]) => amount > 0.005)
      .map(([name, amount]) => ({ name, amount }));

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.amount, creditor.amount);

      balances.push({
        id: `${eventId}-${debtor.name}-${creditor.name}-${balances.length}`,
        eventId,
        eventTitle: eventTitleById.get(eventId) ?? 'Événement',
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount <= 0.005) {
        debtorIndex += 1;
      }

      if (creditor.amount <= 0.005) {
        creditorIndex += 1;
      }
    }
  }

  return balances;
}

export function EventsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setFriends([]);
      setInvitations([]);
      setExpenses([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,date,time,location,description,created_by,created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(getDatabaseErrorMessage(error.message));
      }

      const nextEvents = (data ?? []).map((row) => toEvent(row as EventRow));
      setEvents(nextEvents);

      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('id,name,email,status,created_by,created_at')
        .order('created_at', { ascending: false });

      if (friendError) {
        if (isMissingTableError(friendError.message)) {
          setFriends([]);
        } else {
          throw new Error(getDatabaseErrorMessage(friendError.message));
        }
      } else {
        setFriends((friendData ?? []).map((row) => toFriend(row as FriendRow)));
      }

      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .select('id,event_id,email,name,status,created_by,created_at')
        .order('created_at', { ascending: false });

      if (invitationError) {
        if (isMissingTableError(invitationError.message)) {
          setInvitations([]);
          setExpenses([]);
          return;
        }

        throw new Error(getDatabaseErrorMessage(invitationError.message));
      }

      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('id,event_id,title,amount,paid_by,paid_by_email,date,created_by,created_at')
        .order('created_at', { ascending: false });

      if (expenseError) {
        if (isMissingTableError(expenseError.message)) {
          setInvitations((invitationData ?? []).map((row) => toInvitation(row as InvitationRow)));
          setExpenses([]);
          return;
        }

        throw new Error(getDatabaseErrorMessage(expenseError.message));
      }

      const { data: participantData, error: participantError } = await supabase
        .from('expense_participants')
        .select('id,expense_id,name,email');

      if (participantError) {
        if (isMissingTableError(participantError.message)) {
          setInvitations((invitationData ?? []).map((row) => toInvitation(row as InvitationRow)));
          setExpenses([]);
          return;
        }

        throw new Error(getDatabaseErrorMessage(participantError.message));
      }

      const participants = (participantData ?? []).map((row) =>
        toParticipant(row as ExpenseParticipantRow),
      );
      const participantsByExpense = new Map<string, ExpenseParticipant[]>();

      for (const participant of participants) {
        const currentParticipants = participantsByExpense.get(participant.expenseId) ?? [];
        currentParticipants.push(participant);
        participantsByExpense.set(participant.expenseId, currentParticipants);
      }

      setInvitations((invitationData ?? []).map((row) => toInvitation(row as InvitationRow)));
      setExpenses(
        (expenseData ?? []).map((row) =>
          toExpense(row as ExpenseRow, participantsByExpense.get((row as ExpenseRow).id) ?? []),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      friends,
      invitations,
      expenses,
      balances: calculateBalances(events, expenses),
      loading,
      refreshEvents,
      createEvent: async ({ title, date, time, location, description }) => {
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
            created_by: session.user.id,
          })
          .select('id,title,date,time,location,description,created_by,created_at')
          .single();

        if (error) {
          throw new Error(getDatabaseErrorMessage(error.message));
        }

        const newEvent = toEvent(data as EventRow);

        setEvents((currentEvents) => [newEvent, ...currentEvents]);
      },
      createFriend: async ({ name, email }) => {
        if (!user) {
          throw new Error('Vous devez être connecté pour inviter un ami.');
        }

        const { data, error } = await supabase
          .from('friends')
          .insert({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            created_by: user.id,
          })
          .select('id,name,email,status,created_by,created_at')
          .single();

        if (error) {
          throw new Error(getDatabaseErrorMessage(error.message));
        }

        setFriends((currentFriends) => [toFriend(data as FriendRow), ...currentFriends]);
      },
      createInvitation: async ({ eventId, email, name }) => {
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
      }) => {
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
    }),
    [events, expenses, friends, invitations, loading, refreshEvents, user],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);

  if (!context) {
    throw new Error('useEvents must be used inside EventsProvider');
  }

  return context;
}
