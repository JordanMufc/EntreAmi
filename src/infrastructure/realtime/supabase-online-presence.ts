import { AuthUser } from '@/src/domain/auth/entities';
import { supabase } from '@/src/lib/supabase';

export function subscribeToOnlineFriends(
  user: AuthUser,
  onChange: (onlineFriendEmails: string[]) => void,
) {
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

    onChange([...new Set(nextOnlineEmails)]);
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
    void supabase.removeChannel(channel);
  };
}
