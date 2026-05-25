create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null,
  time text not null,
  location text not null,
  description text default '',
  creator_name text default '',
  creator_email text default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.events add column if not exists creator_name text default '';
alter table public.events add column if not exists creator_email text default '';

update public.events
set
  creator_email = auth.users.email,
  creator_name = coalesce(auth.users.raw_user_meta_data ->> 'username', split_part(auth.users.email, '@', 1))
from auth.users
where public.events.created_by = auth.users.id
and coalesce(public.events.creator_email, '') = '';

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

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  requester_name text default '',
  requester_email text default '',
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.friends add column if not exists requester_name text default '';
alter table public.friends add column if not exists requester_email text default '';

alter table public.friends enable row level security;

drop policy if exists "Users can read their own friends" on public.friends;
create policy "Users can read their own friends"
on public.friends
for select
to authenticated
using (
  created_by = (select auth.uid())
  or lower(email) = lower((select auth.jwt() ->> 'email'))
);

drop policy if exists "Users can create their own friends" on public.friends;
create policy "Users can create their own friends"
on public.friends
for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "Users can update their own friends" on public.friends;
create policy "Users can update their own friends"
on public.friends
for update
to authenticated
using (
  created_by = (select auth.uid())
  or lower(email) = lower((select auth.jwt() ->> 'email'))
)
with check (
  created_by = (select auth.uid())
  or lower(email) = lower((select auth.jwt() ->> 'email'))
);

drop policy if exists "Users can delete their own friends" on public.friends;
create policy "Users can delete their own friends"
on public.friends
for delete
to authenticated
using (
  created_by = (select auth.uid())
  or lower(email) = lower((select auth.jwt() ->> 'email'))
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  email text not null,
  name text default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

create or replace function public.user_owns_event(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    where id = target_event_id
    and created_by = (select auth.uid())
  );
$$;

create or replace function public.user_is_invited_to_event(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invitations
    where event_id = target_event_id
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );
$$;

create or replace function public.user_can_contribute_to_event(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.user_owns_event(target_event_id)
  or exists (
    select 1
    from public.invitations
    where event_id = target_event_id
    and status = 'accepted'
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );
$$;

drop policy if exists "Users can read invitations for their events" on public.invitations;
create policy "Users can read invitations for their events"
on public.invitations
for select
to authenticated
using (
  created_by = (select auth.uid())
  or lower(email) = lower((select auth.jwt() ->> 'email'))
  or public.user_owns_event(event_id)
);

drop policy if exists "Users can create invitations for their events" on public.invitations;
create policy "Users can create invitations for their events"
on public.invitations
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.user_owns_event(event_id)
);

drop policy if exists "Users can update invitations for their events" on public.invitations;
create policy "Users can update invitations for their events"
on public.invitations
for update
to authenticated
using (
  lower(email) = lower((select auth.jwt() ->> 'email'))
  or public.user_owns_event(event_id)
)
with check (
  lower(email) = lower((select auth.jwt() ->> 'email'))
  or public.user_owns_event(event_id)
);

drop policy if exists "Users can delete invitations for their events" on public.invitations;
create policy "Users can delete invitations for their events"
on public.invitations
for delete
to authenticated
using (
  public.user_owns_event(event_id)
);

drop policy if exists "Users can read their own events" on public.events;
create policy "Users can read their own events"
on public.events
for select
to authenticated
using (
  created_by = (select auth.uid())
  or public.user_is_invited_to_event(id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  paid_by text not null,
  paid_by_email text default '',
  date text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create or replace function public.user_owns_expense(target_expense_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.expenses
    where expenses.id = target_expense_id
    and public.user_can_contribute_to_event(expenses.event_id)
  );
$$;

drop policy if exists "Users can read expenses for their events" on public.expenses;
create policy "Users can read expenses for their events"
on public.expenses
for select
to authenticated
using (
  created_by = (select auth.uid())
  or public.user_can_contribute_to_event(event_id)
);

drop policy if exists "Users can create expenses for their events" on public.expenses;
create policy "Users can create expenses for their events"
on public.expenses
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.user_can_contribute_to_event(event_id)
);

drop policy if exists "Users can update expenses for their events" on public.expenses;
create policy "Users can update expenses for their events"
on public.expenses
for update
to authenticated
using (
  public.user_can_contribute_to_event(event_id)
)
with check (
  public.user_can_contribute_to_event(event_id)
);

drop policy if exists "Users can delete expenses for their events" on public.expenses;
create policy "Users can delete expenses for their events"
on public.expenses
for delete
to authenticated
using (
  public.user_can_contribute_to_event(event_id)
);

create table if not exists public.expense_participants (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  name text not null,
  email text default '',
  created_at timestamptz not null default now()
);

alter table public.expense_participants enable row level security;

drop policy if exists "Users can read participants for their expenses" on public.expense_participants;
create policy "Users can read participants for their expenses"
on public.expense_participants
for select
to authenticated
using (
  public.user_owns_expense(expense_id)
);

drop policy if exists "Users can create participants for their expenses" on public.expense_participants;
create policy "Users can create participants for their expenses"
on public.expense_participants
for insert
to authenticated
with check (
  public.user_owns_expense(expense_id)
);

drop policy if exists "Users can update participants for their expenses" on public.expense_participants;
create policy "Users can update participants for their expenses"
on public.expense_participants
for update
to authenticated
using (
  public.user_owns_expense(expense_id)
)
with check (
  public.user_owns_expense(expense_id)
);

drop policy if exists "Users can delete participants for their expenses" on public.expense_participants;
create policy "Users can delete participants for their expenses"
on public.expense_participants
for delete
to authenticated
using (
  public.user_owns_expense(expense_id)
);
