begin;

alter table public.admin_users owner to postgres;
alter function public.is_admin() owner to postgres;
alter function public.is_admin() security definer;
alter function public.is_admin() set search_path = '';
alter function public.is_admin() set row_security = 'off';

do $$
declare
  admin_users_rls_enabled boolean;
  admin_users_force_rls boolean;
  postgres_can_bypass_rls boolean;
begin
  select admin_table.relrowsecurity, admin_table.relforcerowsecurity
  into admin_users_rls_enabled, admin_users_force_rls
  from pg_catalog.pg_class as admin_table
  where admin_table.oid = 'public.admin_users'::regclass;

  select database_role.rolsuper or database_role.rolbypassrls
  into postgres_can_bypass_rls
  from pg_catalog.pg_roles as database_role
  where database_role.rolname = 'postgres';

  if not coalesce(admin_users_rls_enabled, false) then
    raise exception 'RLS must remain enabled on public.admin_users';
  end if;

  if coalesce(admin_users_force_rls, false)
      and not coalesce(postgres_can_bypass_rls, false) then
    raise exception 'The is_admin() owner cannot securely read admin_users under FORCE ROW LEVEL SECURITY';
  end if;
end;
$$;

revoke all privileges on table public.admin_users
from public, anon, authenticated;

revoke all privileges on function public.is_admin()
from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated;

drop policy categories_admin_manage on public.categories;
create policy categories_admin_manage
on public.categories
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy projects_admin_manage on public.projects;
create policy projects_admin_manage
on public.projects
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy project_media_admin_manage on public.project_media;
create policy project_media_admin_manage
on public.project_media
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy project_links_admin_manage on public.project_links;
create policy project_links_admin_manage
on public.project_links
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy portfolio_media_admin_read on storage.objects;
create policy portfolio_media_admin_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

drop policy portfolio_media_admin_upload on storage.objects;
create policy portfolio_media_admin_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

drop policy portfolio_media_admin_replace on storage.objects;
create policy portfolio_media_admin_replace
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
)
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

drop policy portfolio_media_admin_delete on storage.objects;
create policy portfolio_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

drop policy portfolio_media_restrict_read on storage.objects;
create policy portfolio_media_restrict_read
on storage.objects
as restrictive
for select
to public
using (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
);

drop policy portfolio_media_restrict_upload on storage.objects;
create policy portfolio_media_restrict_upload
on storage.objects
as restrictive
for insert
to public
with check (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
);

drop policy portfolio_media_restrict_replace on storage.objects;
create policy portfolio_media_restrict_replace
on storage.objects
as restrictive
for update
to public
using (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
)
with check (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
);

drop policy portfolio_media_restrict_delete on storage.objects;
create policy portfolio_media_restrict_delete
on storage.objects
as restrictive
for delete
to public
using (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
);

commit;
