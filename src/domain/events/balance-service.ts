import { BalanceLine, Event, Expense, Repayment } from './entities';

interface BalanceParticipant {
  key: string;
  name: string;
}

function getParticipantKey(name: string, email: string) {
  const cleanEmail = email.trim().toLowerCase();

  return cleanEmail || name.trim().toLowerCase();
}

export function calculateBalances(events: Event[], expenses: Expense[]): BalanceLine[] {
  const eventTitleById = new Map(events.map((event) => [event.id, event.title]));
  const totalsByEvent = new Map<string, Map<string, { name: string; amount: number }>>();

  for (const expense of expenses) {
    const participants =
      expense.participants.length > 0
        ? expense.participants
        : [{ id: 'payer', expenseId: expense.id, name: expense.paidBy, email: expense.paidByEmail }];
    const uniqueParticipants = new Map<string, BalanceParticipant>();

    for (const participant of participants) {
      const key = getParticipantKey(participant.name, participant.email);

      if (key) {
        uniqueParticipants.set(key, {
          key,
          name: participant.name,
        });
      }
    }

    if (uniqueParticipants.size === 0) {
      continue;
    }

    const share = expense.amount / uniqueParticipants.size;
    const totals = totalsByEvent.get(expense.eventId) ?? new Map<string, { name: string; amount: number }>();
    const payerKey = getParticipantKey(expense.paidBy, expense.paidByEmail);
    const currentPayerTotal = totals.get(payerKey)?.amount ?? 0;

    totals.set(payerKey, {
      name: expense.paidBy,
      amount: currentPayerTotal + expense.amount,
    });

    for (const participant of uniqueParticipants.values()) {
      const currentTotal = totals.get(participant.key);

      totals.set(participant.key, {
        name: currentTotal?.name ?? participant.name,
        amount: (currentTotal?.amount ?? 0) - share,
      });
    }

    totalsByEvent.set(expense.eventId, totals);
  }

  const balances: BalanceLine[] = [];

  for (const [eventId, totals] of totalsByEvent) {
    const debtors = [...totals.entries()]
      .filter(([, total]) => total.amount < -0.005)
      .map(([, total]) => ({ name: total.name, amount: -total.amount }));
    const creditors = [...totals.entries()]
      .filter(([, total]) => total.amount > 0.005)
      .map(([, total]) => ({ name: total.name, amount: total.amount }));

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

export function getRepaymentKey(balance: Pick<BalanceLine | Repayment, 'eventId' | 'from' | 'to'>) {
  return [
    balance.eventId,
    balance.from.trim().toLowerCase(),
    balance.to.trim().toLowerCase(),
  ].join(':');
}

export function calculateOutstandingBalances(
  events: Event[],
  expenses: Expense[],
  repayments: Repayment[],
) {
  const repaidAmountByKey = new Map<string, number>();

  for (const repayment of repayments) {
    const key = getRepaymentKey(repayment);
    repaidAmountByKey.set(key, (repaidAmountByKey.get(key) ?? 0) + repayment.amount);
  }

  return calculateBalances(events, expenses)
    .map((balance) => {
      const repaidAmount = repaidAmountByKey.get(getRepaymentKey(balance)) ?? 0;
      const remainingAmount = Math.round((balance.amount - repaidAmount) * 100) / 100;

      return {
        ...balance,
        amount: remainingAmount,
      };
    })
    .filter((balance) => balance.amount > 0.005);
}
