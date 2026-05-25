import { useEffect, useState } from 'react';

import { supabase } from '@/src/lib/supabase';
import { AuthUser } from '@/src/types/auth';

export function useOnlineFriends(user: AuthUser | null) {
  const [onlineFriendEmails, setOnlineFriendEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.email) {
      setOnlineFriendEmails([]);
      return;
    }

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState<{ email?: string }>();
      const nextOnlineEmails = Object.values(presenceState)
        .flat()
        .map((presence) => presence.email?.toLowerCase())
        .filter((email): email is string => Boolean(email));

      setOnlineFriendEmails([...new Set(nextOnlineEmails)]);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({
          email: user.email.toLowerCase(),
          onlineAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      setOnlineFriendEmails([]);
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return onlineFriendEmails;
}
