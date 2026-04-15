create or replace function public.find_profile_by_username(p_user_name text)
returns table (
    id uuid,
    user_name text
)
language sql
stable
security definer
set search_path = public
as $$
    select p.id, p.user_name
    from public.profiles p
    where lower(p.user_name) = lower(p_user_name)
    limit 1;
$$;

grant execute on function public.find_profile_by_username(text) to authenticated;
