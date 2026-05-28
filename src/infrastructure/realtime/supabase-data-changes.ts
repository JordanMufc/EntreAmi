import { supabase } from "@/src/lib/supabase";

const realtimeTables = [
  "events",
  "friends",
  "invitations",
  "expenses",
  "expense_participants",
  "repayments",
] as const;

export function subscribeToEventsDataChanges(onChange: () => void) {
  const channel = supabase.channel("events-data-changes");

  realtimeTables.forEach((table) => {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      () => {
        onChange();
      },
    );
  });

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
