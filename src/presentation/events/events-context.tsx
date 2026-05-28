import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { createEventsUseCases } from '@/src/application/events/events-use-cases';
import { useAuth } from '@/src/presentation/auth/auth-context';
import { calculateOutstandingBalances } from '@/src/domain/events/balance-service';
import { Event, Expense, Friend, Invitation, Repayment } from '@/src/domain/events/entities';
import { EventsContextValue } from '@/src/presentation/events/events-context-types';
import { supabaseEventsRepository } from '@/src/infrastructure/events/supabase-events-repository';
import { subscribeToEventsDataChanges } from '@/src/infrastructure/realtime/supabase-data-changes';
import { useOnlineFriends } from '@/src/presentation/realtime/use-online-friends';

const EventsContext = createContext<EventsContextValue | null>(null);
const eventsUseCases = createEventsUseCases(supabaseEventsRepository);

export function EventsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshingRef = useRef(false);
  const onlineFriendEmails = useOnlineFriends(user);

  const clearData = useCallback(() => {
    setEvents([]);
    setFriends([]);
    setInvitations([]);
    setExpenses([]);
    setRepayments([]);
  }, []);

  const refreshEvents = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) {
      clearData();
      return;
    }

    if (options?.silent && refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;

    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const nextData = await eventsUseCases.loadEventsData();

      setEvents(nextData.events);
      setFriends(nextData.friends);
      setInvitations(nextData.invitations);
      setExpenses(nextData.expenses);
      setRepayments(nextData.repayments);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }

      refreshingRef.current = false;
    }
  }, [clearData, user]);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let appIsActive = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        void refreshEvents({ silent: true });
      }, 100);
    };
    const unsubscribe = subscribeToEventsDataChanges(scheduleRefresh);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      appIsActive = state === 'active';

      if (appIsActive) {
        scheduleRefresh();
      }
    });
    const pollingInterval = setInterval(() => {
      if (appIsActive) {
        scheduleRefresh();
      }
    }, 2000);

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      clearInterval(pollingInterval);
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [refreshEvents, user]);

  const balances = useMemo(
    () => calculateOutstandingBalances(events, expenses, repayments),
    [events, expenses, repayments],
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      friends,
      onlineFriendEmails,
      invitations,
      expenses,
      balances,
      repayments,
      loading,
      createEvent: async (input) => {
        const { event, invitations: newInvitations } = await eventsUseCases.createEvent(input);
        setEvents((currentEvents) => [event, ...currentEvents]);

        if (newInvitations.length > 0) {
          setInvitations((currentInvitations) => [...newInvitations, ...currentInvitations]);
        }
      },
      deleteEvent: async (id) => {
        await eventsUseCases.deleteEvent(id);
        setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id));
        setInvitations((currentInvitations) =>
          currentInvitations.filter((invitation) => invitation.eventId !== id),
        );
        setExpenses((currentExpenses) =>
          currentExpenses.filter((expense) => expense.eventId !== id),
        );
        setRepayments((currentRepayments) =>
          currentRepayments.filter((repayment) => repayment.eventId !== id),
        );
      },
      createFriend: async (input) => {
        const friend = await eventsUseCases.createFriend(input);
        setFriends((currentFriends) => [friend, ...currentFriends]);
      },
      deleteFriend: async (id) => {
        await eventsUseCases.deleteFriend(id);
        setFriends((currentFriends) => currentFriends.filter((friend) => friend.id !== id));
      },
      updateFriendStatus: async (id, status) => {
        const friend = await eventsUseCases.updateFriendStatus(id, status);
        setFriends((currentFriends) =>
          currentFriends.map((currentFriend) => (currentFriend.id === id ? friend : currentFriend)),
        );
      },
      createInvitation: async (input) => {
        const invitation = await eventsUseCases.createInvitation(input);
        setInvitations((currentInvitations) => [invitation, ...currentInvitations]);
      },
      updateInvitationStatus: async (id, status) => {
        const invitation = await eventsUseCases.updateInvitationStatus(id, status);
        setInvitations((currentInvitations) =>
          currentInvitations.map((currentInvitation) =>
            currentInvitation.id === id ? invitation : currentInvitation,
          ),
        );
      },
      createExpense: async (input) => {
        const expense = await eventsUseCases.createExpense(input);
        setExpenses((currentExpenses) => [expense, ...currentExpenses]);
      },
      markBalanceAsRepaid: async (balance) => {
        const repayment = await eventsUseCases.markBalanceAsRepaid(balance);
        setRepayments((currentRepayments) => [repayment, ...currentRepayments]);
      },
      refreshEvents,
    }),
    [
      balances,
      events,
      expenses,
      friends,
      invitations,
      loading,
      onlineFriendEmails,
      repayments,
      refreshEvents,
    ],
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
