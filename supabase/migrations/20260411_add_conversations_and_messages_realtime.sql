create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    kind text not null check (kind in ('direct', 'group', 'company_group')),
    company_id uuid references public.companies(id) on delete cascade,
    title text,
    created_by uuid not null,
    is_archived boolean not null default false,
    last_message_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    joined_at timestamptz not null default now(),
    left_at timestamptz
);

create table if not exists public.conversation_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_user_id uuid not null,
    body text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint conversation_messages_body_non_empty check (length(trim(body)) > 0)
);

create unique index if not exists uq_conversation_members_conversation_user
    on public.conversation_members (conversation_id, user_id);

create unique index if not exists uq_conversations_company_group
    on public.conversations (company_id)
    where kind = 'company_group';

create index if not exists idx_conversations_last_message_at
    on public.conversations (last_message_at desc nulls last);

create index if not exists idx_conversations_company_kind
    on public.conversations (company_id, kind);

create index if not exists idx_conversation_members_user
    on public.conversation_members (user_id, joined_at desc);

create index if not exists idx_conversation_members_conversation
    on public.conversation_members (conversation_id, joined_at desc);

create index if not exists idx_conversation_messages_conversation_created
    on public.conversation_messages (conversation_id, created_at desc);

create or replace function public.trg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.trg_touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
    update public.conversations
    set last_message_at = now(),
        updated_at = now()
    where id = new.conversation_id;
    return new;
end;
$$;

create or replace function public.trg_sync_company_group_membership_insert()
returns trigger
language plpgsql
as $$
begin
    insert into public.conversation_members (conversation_id, user_id, role)
    select c.id, new.user_id, 'member'
    from public.conversations c
    where c.kind = 'company_group'
      and c.company_id = new.company_id
      and c.is_archived = false
    on conflict (conversation_id, user_id) do nothing;

    return new;
end;
$$;

create or replace function public.trg_sync_company_group_membership_delete()
returns trigger
language plpgsql
as $$
begin
    delete from public.conversation_members cm
    using public.conversations c
    where cm.conversation_id = c.id
      and c.kind = 'company_group'
      and c.company_id = old.company_id
      and cm.user_id = old.user_id;

    return old;
end;
$$;

drop trigger if exists set_updated_at_conversations on public.conversations;
create trigger set_updated_at_conversations
before update on public.conversations
for each row
execute function public.trg_set_updated_at();

drop trigger if exists set_updated_at_conversation_messages on public.conversation_messages;
create trigger set_updated_at_conversation_messages
before update on public.conversation_messages
for each row
execute function public.trg_set_updated_at();

drop trigger if exists touch_conversation_on_message_insert on public.conversation_messages;
create trigger touch_conversation_on_message_insert
after insert on public.conversation_messages
for each row
execute function public.trg_touch_conversation_on_message();

drop trigger if exists sync_company_group_membership_on_insert on public.company_members;
create trigger sync_company_group_membership_on_insert
after insert on public.company_members
for each row
execute function public.trg_sync_company_group_membership_insert();

drop trigger if exists sync_company_group_membership_on_delete on public.company_members;
create trigger sync_company_group_membership_on_delete
after delete on public.company_members
for each row
execute function public.trg_sync_company_group_membership_delete();

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.conversation_messages enable row level security;

drop policy if exists conversations_select on public.conversations;
create policy conversations_select
on public.conversations for select
using (
    exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversations.id
          and cm.user_id = auth.uid()
          and cm.left_at is null
    )
);

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert
on public.conversations for insert
with check (
    created_by = auth.uid()
    and (
        kind <> 'company_group'
        or (
            company_id is not null
            and exists (
                select 1
                from public.company_members m
                where m.company_id = conversations.company_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner', 'admin')
            )
        )
    )
);

drop policy if exists conversations_update on public.conversations;
create policy conversations_update
on public.conversations for update
using (
    exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversations.id
          and cm.user_id = auth.uid()
          and cm.left_at is null
    )
)
with check (
    exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversations.id
          and cm.user_id = auth.uid()
          and cm.left_at is null
    )
);

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select
on public.conversation_members for select
using (
    exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversation_members.conversation_id
          and cm.user_id = auth.uid()
          and cm.left_at is null
    )
);

drop policy if exists conversation_members_insert on public.conversation_members;
create policy conversation_members_insert
on public.conversation_members for insert
with check (
    user_id = auth.uid()
    or exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversation_members.conversation_id
          and cm.user_id = auth.uid()
          and cm.left_at is null
          and cm.role in ('owner', 'admin')
    )
);

drop policy if exists conversation_members_update on public.conversation_members;
create policy conversation_members_update
on public.conversation_members for update
using (
    user_id = auth.uid()
    or exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversation_members.conversation_id
          and cm.user_id = auth.uid()
          and cm.left_at is null
          and cm.role in ('owner', 'admin')
    )
)
with check (
    user_id = auth.uid()
    or exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversation_members.conversation_id
          and cm.user_id = auth.uid()
          and cm.left_at is null
          and cm.role in ('owner', 'admin')
    )
);

drop policy if exists conversation_messages_select on public.conversation_messages;
create policy conversation_messages_select
on public.conversation_messages for select
using (
    exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversation_messages.conversation_id
          and cm.user_id = auth.uid()
          and cm.left_at is null
    )
);

drop policy if exists conversation_messages_insert on public.conversation_messages;
create policy conversation_messages_insert
on public.conversation_messages for insert
with check (
    sender_user_id = auth.uid()
    and exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = conversation_messages.conversation_id
          and cm.user_id = auth.uid()
          and cm.left_at is null
    )
);

drop policy if exists conversation_messages_update on public.conversation_messages;
create policy conversation_messages_update
on public.conversation_messages for update
using (sender_user_id = auth.uid())
with check (sender_user_id = auth.uid());

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'conversations'
    ) then
        execute 'alter publication supabase_realtime add table public.conversations';
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'conversation_members'
    ) then
        execute 'alter publication supabase_realtime add table public.conversation_members';
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'conversation_messages'
    ) then
        execute 'alter publication supabase_realtime add table public.conversation_messages';
    end if;
end;
$$;
