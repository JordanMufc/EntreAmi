export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}
