create or replace function public.is_conversation_member(
    p_conversation_id uuid,
    p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = p_conversation_id
          and cm.user_id = p_user_id
          and cm.left_at is null
    );
$$;

create or replace function public.is_conversation_member_with_roles(
    p_conversation_id uuid,
    p_user_id uuid,
    p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = p_conversation_id
          and cm.user_id = p_user_id
          and cm.left_at is null
          and cm.role = any(p_roles)
    );
$$;

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select
on public.conversation_members for select
using (
    public.is_conversation_member(conversation_members.conversation_id, auth.uid())
);

drop policy if exists conversation_members_insert on public.conversation_members;
create policy conversation_members_insert
on public.conversation_members for insert
with check (
    user_id = auth.uid()
    or public.is_conversation_member_with_roles(
        conversation_members.conversation_id,
        auth.uid(),
        array['owner', 'admin']
    )
);

drop policy if exists conversation_members_update on public.conversation_members;
create policy conversation_members_update
on public.conversation_members for update
using (
    user_id = auth.uid()
    or public.is_conversation_member_with_roles(
        conversation_members.conversation_id,
        auth.uid(),
        array['owner', 'admin']
    )
)
with check (
    user_id = auth.uid()
    or public.is_conversation_member_with_roles(
        conversation_members.conversation_id,
        auth.uid(),
        array['owner', 'admin']
    )
);
