import {
  Event,
  Expense,
  ExpenseParticipant,
  Friend,
  FriendStatus,
  Invitation,
  InvitationStatus,
} from '@/src/types/event';

export interface EventRow {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface FriendRow {
  id: string;
  name: string;
  email: string;
  requester_name: string | null;
  requester_email: string | null;
  status: FriendStatus;
  created_by: string;
  created_at: string;
}

export interface InvitationRow {
  id: string;
  event_id: string;
  email: string;
  name: string | null;
  status: InvitationStatus;
  created_by: string;
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  event_id: string;
  title: string;
  amount: number | string;
  paid_by: string;
  paid_by_email: string | null;
  date: string;
  created_by: string;
  created_at: string;
}

export interface ExpenseParticipantRow {
  id: string;
  expense_id: string;
  name: string;
  email: string | null;
}

export function toEvent(row: EventRow): Event {
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

export function toFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    requesterName: row.requester_name ?? '',
    requesterEmail: row.requester_email ?? '',
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    eventId: row.event_id,
    email: row.email,
    name: row.name ?? '',
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function toExpense(row: ExpenseRow, participants: ExpenseParticipant[]): Expense {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    amount: Number(row.amount),
    paidBy: row.paid_by,
    paidByEmail: row.paid_by_email ?? '',
    date: row.date,
    participants,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function toParticipant(row: ExpenseParticipantRow): ExpenseParticipant {
  return {
    id: row.id,
    expenseId: row.expense_id,
    name: row.name,
    email: row.email ?? '',
  };
}

export function isMissingTableError(message: string) {
  return message.includes('Could not find the table') || message.includes('does not exist');
}

export function getDatabaseErrorMessage(message: string) {
  if (isMissingTableError(message)) {
    return 'La table Supabase est manquante. Exécutez le fichier supabase/schema.sql dans le SQL Editor de Supabase.';
  }

  if (message.toLowerCase().includes('row-level security')) {
    return 'Supabase a refusé l’écriture. Vérifiez que les policies RLS du fichier supabase/schema.sql sont bien appliquées.';
  }

  return message;
}
