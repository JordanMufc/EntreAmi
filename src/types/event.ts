export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  creatorName: string;
  creatorEmail: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  invitedFriends?: {
    name: string;
    email: string;
  }[];
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export type FriendStatus = 'invited' | 'accepted' | 'declined';

export interface Friend {
  id: string;
  name: string;
  email: string;
  requesterName: string;
  requesterEmail: string;
  status: FriendStatus;
  createdBy: string;
  createdAt: string;
}

export interface CreateFriendInput {
  name: string;
  email: string;
}

export interface Invitation {
  id: string;
  eventId: string;
  email: string;
  name: string;
  status: InvitationStatus;
  createdBy: string;
  createdAt: string;
}

export interface CreateInvitationInput {
  eventId: string;
  email: string;
  name: string;
}

export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  name: string;
  email: string;
}

export interface Expense {
  id: string;
  eventId: string;
  title: string;
  amount: number;
  paidBy: string;
  paidByEmail: string;
  date: string;
  participants: ExpenseParticipant[];
  createdBy: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  eventId: string;
  title: string;
  amount: number;
  paidBy: string;
  paidByEmail: string;
  date: string;
  participants: {
    name: string;
    email: string;
  }[];
}

export interface BalanceLine {
  id: string;
  eventId: string;
  eventTitle: string;
  from: string;
  to: string;
  amount: number;
}
