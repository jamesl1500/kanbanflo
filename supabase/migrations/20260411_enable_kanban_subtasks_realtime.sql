alter table public.kanban_subtasks replica identity full;

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'kanban_subtasks'
    ) then
        execute 'alter publication supabase_realtime add table public.kanban_subtasks';
    end if;
end;
$$;