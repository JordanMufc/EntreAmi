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
} from './entities';

export interface EventsData {
  events: Event[];
  friends: Friend[];
  invitations: Invitation[];
  expenses: Expense[];
  repayments: Repayment[];
}

export interface EventsRepository {
  loadEventsData: () => Promise<EventsData>;
  createEvent: (input: CreateEventInput) => Promise<{
    event: Event;
    invitations: Invitation[];
  }>;
  deleteEvent: (id: string) => Promise<void>;
  createFriend: (input: CreateFriendInput) => Promise<Friend>;
  deleteFriend: (id: string) => Promise<void>;
  updateFriendStatus: (id: string, status: FriendStatus) => Promise<Friend>;
  createInvitation: (input: CreateInvitationInput) => Promise<Invitation>;
  updateInvitationStatus: (id: string, status: InvitationStatus) => Promise<Invitation>;
  createExpense: (input: CreateExpenseInput) => Promise<Expense>;
  markBalanceAsRepaid: (balance: BalanceLine) => Promise<Repayment>;
}
