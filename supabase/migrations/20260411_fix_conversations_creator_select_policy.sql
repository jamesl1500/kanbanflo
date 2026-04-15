create or replace function public.can_access_conversation(
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
    )
    or public.is_conversation_member(p_conversation_id, p_user_id);
$$;

drop policy if exists conversations_select on public.conversations;
create policy conversations_select
on public.conversations for select
using (
    public.can_access_conversation(conversations.id, auth.uid())
);

drop policy if exists conversations_update on public.conversations;
create policy conversations_update
on public.conversations for update
using (
    public.is_conversation_member(conversations.id, auth.uid())
)
with check (
    public.is_conversation_member(conversations.id, auth.uid())
);

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert
on public.conversations for insert
with check (
    created_by = auth.uid()
    and company_id is not null
    and public.is_company_member(company_id, auth.uid())
    and (
        kind <> 'company_group'
        or public.is_company_admin_or_owner(company_id, auth.uid())
    )
);