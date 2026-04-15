create table if not exists public.activity_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid not null references auth.users(id) on delete cascade,
    activity_type text not null,
    title text not null,
    description text,
    entity_type text,
    entity_id uuid,
    company_id uuid references public.companies(id) on delete set null,
    workspace_id uuid references public.workspaces(id) on delete set null,
    card_id uuid references public.kanban_cards(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_actor_created
    on public.activity_events (actor_user_id, created_at desc);

create index if not exists idx_activity_events_company_created
    on public.activity_events (company_id, created_at desc)
    where company_id is not null;

alter table public.activity_events enable row level security;

drop policy if exists "activity_events_select_own" on public.activity_events;
create policy "activity_events_select_own"
    on public.activity_events
    for select
    using (actor_user_id = auth.uid());

drop policy if exists "activity_events_insert_own" on public.activity_events;
create policy "activity_events_insert_own"
    on public.activity_events
    for insert
    with check (actor_user_id = auth.uid());

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_user_id uuid not null references auth.users(id) on delete cascade,
    actor_user_id uuid references auth.users(id) on delete set null,
    notification_type text not null,
    title text not null,
    body text,
    entity_type text,
    entity_id uuid,
    company_id uuid references public.companies(id) on delete set null,
    workspace_id uuid references public.workspaces(id) on delete set null,
    card_id uuid references public.kanban_cards(id) on delete set null,
    is_read boolean not null default false,
    read_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_unread_created
    on public.notifications (recipient_user_id, is_read, created_at desc);

create index if not exists idx_notifications_recipient_created
    on public.notifications (recipient_user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
    on public.notifications
    for select
    using (recipient_user_id = auth.uid());

drop policy if exists "notifications_insert_actor_or_recipient" on public.notifications;
create policy "notifications_insert_actor_or_recipient"
    on public.notifications
    for insert
    with check (
        auth.uid() is not null
        and (actor_user_id = auth.uid() or recipient_user_id = auth.uid())
    );

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
    on public.notifications
    for update
    using (recipient_user_id = auth.uid())
    with check (recipient_user_id = auth.uid());
