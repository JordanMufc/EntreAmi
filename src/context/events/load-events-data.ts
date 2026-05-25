import { supabase } from "@/src/lib/supabase";
import {
  Event,
  Expense,
  ExpenseParticipant,
  Friend,
  Invitation,
} from "@/src/types/event";

import {
  EventRow,
  ExpenseParticipantRow,
  ExpenseRow,
  FriendRow,
  getDatabaseErrorMessage,
  InvitationRow,
  isMissingTableError,
  toEvent,
  toExpense,
  toFriend,
  toInvitation,
  toParticipant,
} from "./database";

export interface EventsData {
  events: Event[];
  friends: Friend[];
  invitations: Invitation[];
  expenses: Expense[];
}

export async function loadEventsData(): Promise<EventsData> {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,date,time,location,description,creator_name,creator_email,created_by,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getDatabaseErrorMessage(error.message));
  }

  const events = (data ?? []).map((row) => toEvent(row as EventRow));

  const { data: friendData, error: friendError } = await supabase
    .from("friends")
    .select("id,name,email,requester_name,requester_email,status,created_by,created_at")
    .order("created_at", { ascending: false });

  if (friendError && !isMissingTableError(friendError.message)) {
    throw new Error(getDatabaseErrorMessage(friendError.message));
  }

  const friends = friendError
    ? []
    : (friendData ?? []).map((row) => toFriend(row as FriendRow));

  const { data: invitationData, error: invitationError } = await supabase
    .from("invitations")
    .select("id,event_id,email,name,status,created_by,created_at")
    .order("created_at", { ascending: false });

  if (invitationError) {
    if (isMissingTableError(invitationError.message)) {
      return { events, friends, invitations: [], expenses: [] };
    }

    throw new Error(getDatabaseErrorMessage(invitationError.message));
  }

  const invitations = (invitationData ?? []).map((row) =>
    toInvitation(row as InvitationRow),
  );

  const { data: expenseData, error: expenseError } = await supabase
    .from("expenses")
    .select(
      "id,event_id,title,amount,paid_by,paid_by_email,date,created_by,created_at",
    )
    .order("created_at", { ascending: false });

  if (expenseError) {
    if (isMissingTableError(expenseError.message)) {
      return { events, friends, invitations, expenses: [] };
    }

    throw new Error(getDatabaseErrorMessage(expenseError.message));
  }

  const { data: participantData, error: participantError } = await supabase
    .from("expense_participants")
    .select("id,expense_id,name,email");

  if (participantError) {
    if (isMissingTableError(participantError.message)) {
      return { events, friends, invitations, expenses: [] };
    }

    throw new Error(getDatabaseErrorMessage(participantError.message));
  }

  const participants = (participantData ?? []).map((row) =>
    toParticipant(row as ExpenseParticipantRow),
  );
  const participantsByExpense = new Map<string, ExpenseParticipant[]>();

  for (const participant of participants) {
    const currentParticipants =
      participantsByExpense.get(participant.expenseId) ?? [];
    currentParticipants.push(participant);
    participantsByExpense.set(participant.expenseId, currentParticipants);
  }

  return {
    events,
    friends,
    invitations,
    expenses: (expenseData ?? []).map((row) =>
      toExpense(
        row as ExpenseRow,
        participantsByExpense.get((row as ExpenseRow).id) ?? [],
      ),
    ),
  };
}
