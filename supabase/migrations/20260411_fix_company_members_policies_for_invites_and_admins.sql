create or replace function public.is_company_member(
    p_company_id uuid,
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
        from public.company_members cm
        where cm.company_id = p_company_id
          and cm.user_id = p_user_id
    );
$$;

create or replace function public.is_company_admin_or_owner(
    p_company_id uuid,
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
        from public.company_members cm
        where cm.company_id = p_company_id
          and cm.user_id = p_user_id
          and cm.role in ('owner', 'admin')
    )
    or exists (
        select 1
        from public.companies c
        where c.id = p_company_id
          and c.owner_id = p_user_id
    );
$$;

create or replace function public.can_self_join_company(
    p_company_id uuid,
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
        from public.companies c
        where c.id = p_company_id
          and c.owner_id = p_user_id
    )
    or exists (
        select 1
        from public.company_invites ci
        where ci.company_id = p_company_id
          and lower(ci.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and ci.status = 'pending'
          and ci.expires_at > now()
    );
$$;

drop policy if exists "Users can view their own memberships" on public.company_members;
create policy "Company members can view memberships"
on public.company_members for select
using (
    public.is_company_member(company_members.company_id, auth.uid())
);

drop policy if exists "Users can insert their own membership" on public.company_members;
drop policy if exists "Users can join a company" on public.company_members;
create policy "Company members insert policy"
on public.company_members for insert
with check (
    public.is_company_admin_or_owner(company_members.company_id, auth.uid())
    or (
        company_members.user_id = auth.uid()
        and public.can_self_join_company(company_members.company_id, auth.uid())
    )
);

drop policy if exists "Owner can update members" on public.company_members;
create policy "Company admins can update members"
on public.company_members for update
using (
    public.is_company_admin_or_owner(company_members.company_id, auth.uid())
)
with check (
    public.is_company_admin_or_owner(company_members.company_id, auth.uid())
);

drop policy if exists "Owner can delete members" on public.company_members;
create policy "Company admins can delete members"
on public.company_members for delete
using (
    public.is_company_admin_or_owner(company_members.company_id, auth.uid())
);
