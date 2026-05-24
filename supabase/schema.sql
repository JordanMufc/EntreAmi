create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null,
  time text not null,
  location text not null,
  description text default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "Users can read their own events" on public.events;
create policy "Users can read their own events"
on public.events
for select
to authenticated
using (created_by = (select auth.uid()));

drop policy if exists "Users can create their own events" on public.events;
create policy "Users can create their own events"
on public.events
for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events"
on public.events
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events"
on public.events
for delete
to authenticated
using (created_by = (select auth.uid()));
