
begin;

-- 1. Admin authorization function
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as administrators
    where administrators.id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin()
from public, anon, authenticated;

grant execute on function public.is_admin()
to anon, authenticated;

-- 2. Public schema permissions
grant usage on schema public to anon, authenticated;

grant select on table
  public.categories,
  public.projects,
  public.project_media,
  public.project_links
to anon, authenticated;

grant insert, update, delete on table
  public.categories,
  public.projects,
  public.project_media,
  public.project_links
to authenticated;

-- 3. Categories policies
create policy categories_public_read
on public.categories
for select
to anon, authenticated
using (is_active);

create policy categories_admin_manage
on public.categories
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 4. Projects policies
create policy projects_public_read
on public.projects
for select
to anon, authenticated
using (status = 'published');

create policy projects_admin_manage
on public.projects
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 5. Project media policies
create policy project_media_public_read
on public.project_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_media.project_id
      and projects.status = 'published'
  )
);

create policy project_media_admin_manage
on public.project_media
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 6. Project links policies
create policy project_links_public_read
on public.project_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_links.project_id
      and projects.status = 'published'
  )
);

create policy project_links_admin_manage
on public.project_links
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 7. Create private Storage bucket
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', false)
on conflict (id) do update
set name = excluded.name,
    public = false;

-- IMPORTANT:
-- Do not ALTER storage.objects or enable RLS here.
-- Supabase Storage manages RLS on this table.

-- 8. Admin-only Storage policies
create policy portfolio_media_admin_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

create policy portfolio_media_admin_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

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

create policy portfolio_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_admin())
);

-- 9. Restrictive Storage policies
-- Prevent broader permissive policies from granting access
-- to this private portfolio bucket.

create policy portfolio_media_restrict_read
on storage.objects
as restrictive
for select
to public
using (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
);

create policy portfolio_media_restrict_upload
on storage.objects
as restrictive
for insert
to public
with check (
  bucket_id <> 'portfolio-media'
  or (select public.is_admin())
);

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
