import {
  BalanceLine,
  CreateEventInput,
  CreateExpenseInput,
  CreateFriendInput,
  CreateInvitationInput,
  Event,
  Expense,
  Friend,
  FriendStatus,
  Invitation,
  InvitationStatus,
  Repayment,
} from '@/src/domain/events/entities';

export interface EventsContextValue {
  events: Event[];
  friends: Friend[];
  onlineFriendEmails: string[];
  invitations: Invitation[];
  expenses: Expense[];
  balances: BalanceLine[];
  repayments: Repayment[];
  loading: boolean;
  createEvent: (input: CreateEventInput) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  createFriend: (input: CreateFriendInput) => Promise<void>;
  deleteFriend: (id: string) => Promise<void>;
  updateFriendStatus: (id: string, status: FriendStatus) => Promise<void>;
  createInvitation: (input: CreateInvitationInput) => Promise<void>;
  updateInvitationStatus: (id: string, status: InvitationStatus) => Promise<void>;
  createExpense: (input: CreateExpenseInput) => Promise<void>;
  markBalanceAsRepaid: (balance: BalanceLine) => Promise<void>;
  refreshEvents: () => Promise<void>;
}
