import { EventsRepository } from '@/src/domain/events/events-repository';
import {
  BalanceLine,
  CreateEventInput,
  CreateExpenseInput,
  CreateFriendInput,
  CreateInvitationInput,
  FriendStatus,
  InvitationStatus,
} from '@/src/domain/events/entities';

export function createEventsUseCases(eventsRepository: EventsRepository) {
  return {
    loadEventsData: () => eventsRepository.loadEventsData(),
    createEvent: (input: CreateEventInput) => eventsRepository.createEvent(input),
    deleteEvent: (id: string) => eventsRepository.deleteEvent(id),
    createFriend: (input: CreateFriendInput) => eventsRepository.createFriend(input),
    deleteFriend: (id: string) => eventsRepository.deleteFriend(id),
    updateFriendStatus: (id: string, status: FriendStatus) =>
      eventsRepository.updateFriendStatus(id, status),
    createInvitation: (input: CreateInvitationInput) => eventsRepository.createInvitation(input),
    updateInvitationStatus: (id: string, status: InvitationStatus) =>
      eventsRepository.updateInvitationStatus(id, status),
    createExpense: (input: CreateExpenseInput) => eventsRepository.createExpense(input),
    markBalanceAsRepaid: (balance: BalanceLine) => eventsRepository.markBalanceAsRepaid(balance),
  };
}
