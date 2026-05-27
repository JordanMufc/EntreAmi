import { useEffect, useState } from 'react';

import { AuthUser } from '@/src/domain/auth/entities';
import { subscribeToOnlineFriends } from '@/src/infrastructure/realtime/supabase-online-presence';

export function useOnlineFriends(user: AuthUser | null) {
  const [onlineFriendEmails, setOnlineFriendEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.email) {
      setOnlineFriendEmails([]);
      return;
    }

    const unsubscribe = subscribeToOnlineFriends(user, setOnlineFriendEmails);

    return () => {
      setOnlineFriendEmails([]);
      unsubscribe();
    };
  }, [user]);

  return onlineFriendEmails;
}
