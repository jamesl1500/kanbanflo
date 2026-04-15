create or replace function public.is_conversation_creator(
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
        from public.conversations c
        where c.id = p_conversation_id
          and c.created_by = p_user_id
    );
$$;

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
    or public.is_conversation_creator(
        conversation_members.conversation_id,
        auth.uid()
    )
);