alter table public.kanban_lists replica identity full;
alter table public.kanban_cards replica identity full;

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'kanban_lists'
    ) then
        execute 'alter publication supabase_realtime add table public.kanban_lists';
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'kanban_cards'
    ) then
        execute 'alter publication supabase_realtime add table public.kanban_cards';
    end if;
end;
$$;