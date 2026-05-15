import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/src/context/auth-context';
import { CreateEventInput, Event } from '@/src/types/event';

interface EventsContextValue {
  events: Event[];
  createEvent: (input: CreateEventInput) => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  const value = useMemo<EventsContextValue>(
    () => ({
      events: user
        ? events.filter((event) => event.createdBy === user.id)
        : [],
      createEvent: async ({ title, date, time, location, description }) => {
        if (!user) {
          throw new Error('Vous devez être connecté pour créer un événement.');
        }

        const newEvent: Event = {
          id: String(Date.now()),
          title: title.trim(),
          date: date.trim(),
          time: time.trim(),
          location: location.trim(),
          description: description.trim(),
          createdBy: user.id,
          createdAt: new Date().toISOString(),
        };

        setEvents((currentEvents) => [newEvent, ...currentEvents]);
      },
    }),
    [events, user],
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
