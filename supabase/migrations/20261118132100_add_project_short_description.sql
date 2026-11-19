begin;

alter table public.projects
add column short_description text not null default ''
check (char_length(short_description) <= 300);

commit;
