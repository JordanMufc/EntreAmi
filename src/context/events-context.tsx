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
import { CreateEventInput, Event } from '@/src/types/event';

interface EventsContextValue {
  events: Event[];
  loading: boolean;
  createEvent: (input: CreateEventInput) => Promise<void>;
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

export function EventsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,date,time,location,description,created_by,created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setEvents((data ?? []).map((row) => toEvent(row as EventRow)));
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
      loading,
      refreshEvents,
      createEvent: async ({ title, date, time, location, description }) => {
        if (!user) {
          throw new Error('Vous devez être connecté pour créer un événement.');
        }

        const { data, error } = await supabase
          .from('events')
          .insert({
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            location: location.trim(),
            description: description.trim(),
            created_by: user.id,
          })
          .select('id,title,date,time,location,description,created_by,created_at')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        const newEvent = toEvent(data as EventRow);

        setEvents((currentEvents) => [newEvent, ...currentEvents]);
      },
    }),
    [events, loading, refreshEvents, user],
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
