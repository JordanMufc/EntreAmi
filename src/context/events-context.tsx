import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/src/context/auth-context';
import { Event, Expense, Friend, Invitation } from '@/src/types/event';

import { calculateBalances } from './events/balances';
import { createEventActions } from './events/event-actions';
import { EventsContextValue } from './events/events-context-types';
import { loadEventsData } from './events/load-events-data';
import { useOnlineFriends } from './events/use-online-friends';

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const onlineFriendEmails = useOnlineFriends(user);

  const clearData = useCallback(() => {
    setEvents([]);
    setFriends([]);
    setInvitations([]);
    setExpenses([]);
  }, []);

  const refreshEvents = useCallback(async () => {
    if (!user) {
      clearData();
      return;
    }

    setLoading(true);

    try {
      const nextData = await loadEventsData();

      setEvents(nextData.events);
      setFriends(nextData.friends);
      setInvitations(nextData.invitations);
      setExpenses(nextData.expenses);
    } finally {
      setLoading(false);
    }
  }, [clearData, user]);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  const actions = useMemo(
    () =>
      createEventActions({
        user,
        setEvents,
        setFriends,
        setInvitations,
        setExpenses,
      }),
    [user],
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      friends,
      onlineFriendEmails,
      invitations,
      expenses,
      balances: calculateBalances(events, expenses),
      loading,
      refreshEvents,
      ...actions,
    }),
    [actions, events, expenses, friends, invitations, loading, onlineFriendEmails, refreshEvents],
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
