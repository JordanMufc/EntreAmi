import { useMemo } from 'react';

import { useAuth } from '@/src/presentation/auth/auth-context';
import { useEvents } from '@/src/presentation/events/events-context';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getBadgeValue(count: number) {
  return count > 0 ? count : undefined;
}

export function useTabNotificationCounts() {
  const { user } = useAuth();
  const { balances, expenses, friends, invitations } = useEvents();

  return useMemo(() => {
    if (!user) {
      return {
        home: undefined,
        invitations: undefined,
        friends: undefined,
        balances: undefined,
      };
    }

    const userEmail = normalize(user.email);
    const userNames = new Set([normalize(user.username), userEmail.split('@')[0]].filter(Boolean));

    for (const expense of expenses) {
      if (normalize(expense.paidByEmail) === userEmail) {
        userNames.add(normalize(expense.paidBy));
      }

      for (const participant of expense.participants) {
        if (normalize(participant.email) === userEmail) {
          userNames.add(normalize(participant.name));
        }
      }
    }

    const invitationCount = invitations.filter(
      (invitation) =>
        normalize(invitation.email) === userEmail &&
        invitation.createdBy !== user.id &&
        invitation.status === 'pending',
    ).length;
    const friendRequestCount = friends.filter(
      (friend) =>
        normalize(friend.email) === userEmail &&
        friend.createdBy !== user.id &&
        friend.status === 'invited',
    ).length;
    const repaymentRequestCount = balances.filter((balance) =>
      userNames.has(normalize(balance.from)),
    ).length;
    const totalCount = invitationCount + friendRequestCount + repaymentRequestCount;

    return {
      home: getBadgeValue(totalCount),
      invitations: getBadgeValue(invitationCount),
      friends: getBadgeValue(friendRequestCount),
      balances: getBadgeValue(repaymentRequestCount),
    };
  }, [balances, expenses, friends, invitations, user]);
}
