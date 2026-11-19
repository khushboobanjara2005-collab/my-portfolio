# Supabase setup

The migrations in `migrations/` define the portfolio schema, access policies, administrator authorization, and private media bucket. Apply them in timestamp order, including any forward-only migration added after the initial setup.

## Connect the project

1. Create a Supabase project and keep its project reference and dashboard access private.
2. For local frontend configuration, copy `.env.example` to `.env.local` at the repository root and fill in the project URL and publishable key. `.env.local` is excluded by `.gitignore`. These values are intended for browser use. Never put a service-role key in the frontend or commit credentials.
3. Use either the Supabase SQL Editor or the Supabase CLI to apply migrations.

### Supabase SQL Editor

Open each `migrations/*.sql` file in timestamp order and execute its contents in the SQL Editor. Do not mix this with `supabase db push` unless migration history has been reconciled; SQL Editor execution does not register files in the CLI migration history.

### Supabase CLI

The repository includes a local `supabase/config.toml`; its `project_id` is only a local project label, not a remote project reference or credential. Install the Supabase CLI using the official Supabase instructions, then from the repository root run:

```powershell
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

CLI authentication is local to the developer environment. Do not save an access token in this repository.

## Deploy the public media signer

The public Work pages read published project rows with the existing anonymous SELECT policies. Uploaded media stays in the private `portfolio-media` bucket. The `public-media-url` Edge Function accepts a media row UUID, verifies its project is published, checks that the referenced object exists, obtains the storage path from that row, and returns a one-hour signed URL. It never accepts a caller-supplied storage path.

The function is intentionally configured with `verify_jwt = false` so anonymous visitors using the existing publishable key can invoke it. It only signs supported uploads associated with a currently published project. The function requires the server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; Supabase provides these to Edge Functions. If they are not available in the function environment, set them as Edge Function secrets in the Dashboard or with the CLI. Never use a `VITE_` prefix or put the service-role key in `.env.local` or frontend code.

From the repository root, authenticate the Supabase CLI, link the actual remote project (the local `project_id` in `config.toml` is not its remote reference), then deploy:

```powershell
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy public-media-url
```

The frontend continues to use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. No database migration, RLS policy, or bucket visibility change is required.

After deployment, verify anonymously that `/work` lists only published projects, that the project detail route plays uploaded videos with controls, and that image/video media still loads after its one-hour URL expires and refreshes. The signer should return HTTP 400 for a malformed media ID and HTTP 404 for an unknown media ID or media attached to an unpublished project. A valid media ID should return `expiresIn: 3600`; after one hour, the returned URL should no longer serve the object. Anonymous direct reads of private `portfolio-media` objects must remain denied.

## Create and authorize the first administrator

1. In Supabase Dashboard, create the owner's account directly through **Authentication → Users**. Keep public sign-up disabled; do not add a public registration flow.
2. Copy that existing Auth user's UUID.
3. In the SQL Editor, insert only that UUID into the authorization allow-list:

```sql
insert into public.admin_users (id)
values ('<existing-auth-user-uuid>'::uuid);
```

Replace the placeholder with the UUID copied from Auth. Do not create a made-up UUID or a corresponding fake user. To revoke administrator access, delete that user's row from `public.admin_users`; deleting the Auth user also removes the row through the foreign key.

The `admin_users` table has RLS enabled, no client policies, and no table privileges for `anon` or `authenticated`. Only a privileged database operator should maintain its rows. The hardening migration assigns both the table and `public.is_admin()` to the trusted `postgres` role. The function uses a fixed empty `search_path` and `row_security = off`; if its owner cannot bypass enforced RLS, it errors rather than silently treating an administrator as unauthorized.

Deleting a project cascades its media and link records. The admin service explicitly attempts to remove only storage objects referenced by that project's media rows and reports cleanup failures.

The admin project editor stores the brief summary in `projects.short_description`, added by `20261118132100_add_project_short_description.sql`. Apply this new migration before using project management; the original three migrations remain unchanged. The project cover is the first image in `project_media.display_order` because the existing schema has no separate cover column.

Admin media uploads use the private `portfolio-media` bucket and the signed-in user's access token; the bucket must remain private. The frontend limit defaults to 45 MB per file and can be lowered or raised up to 50 MB with `VITE_PORTFOLIO_MEDIA_MAX_FILE_SIZE_MB`. This is a client-side guard, not a bucket quota setting. Confirm the Supabase project's Storage size/type limits and available plan quota in the Dashboard. Large uploads above this limit require another delivery option; this implementation does not provide resumable uploads.

The admin app signs users in through Supabase email/password authentication and checks `public.is_admin()` on each restored or newly established session. No signup UI is provided. Keep public signups disabled in Supabase Auth and create/authorize the owner account using the steps above. Client route checks are not a replacement for RLS.

### Read-only Phase 3A checks

Run these queries in the Supabase SQL Editor to verify the live project. They do not change data or policies.

```sql
select
  function_owner.rolname as function_owner,
  admin_owner.rolname as admin_users_owner,
  function_def.prosecdef as security_definer,
  function_def.proconfig as function_settings,
  has_function_privilege('anon', function_def.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', function_def.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', function_def.oid, 'EXECUTE') as service_role_can_execute,
  exists (
    select 1
    from pg_catalog.aclexplode(
      coalesce(
        function_def.proacl,
        pg_catalog.acldefault('f', function_def.proowner)
      )
    ) as acl
    where acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) as public_can_execute
from pg_catalog.pg_proc as function_def
join pg_catalog.pg_roles as function_owner
  on function_owner.oid = function_def.proowner
join pg_catalog.pg_class as admin_table
  on admin_table.oid = 'public.admin_users'::regclass
join pg_catalog.pg_roles as admin_owner
  on admin_owner.oid = admin_table.relowner
where function_def.oid = 'public.is_admin()'::regprocedure;
```

Expected: both owners are `postgres`, `security_definer` is true, `function_settings` contains an empty `search_path` and `row_security=off`, anon/authenticated can execute, and `service_role`/`PUBLIC` cannot.

```sql
select
  has_table_privilege('anon', 'public.admin_users', 'select') as anon_can_read_admin_users,
  has_table_privilege('authenticated', 'public.admin_users', 'select') as authenticated_can_read_admin_users,
  (select count(*) from public.admin_users) as authorized_admin_count;

select exists (
  select 1
  from public.admin_users
  where id = '<existing-auth-user-uuid>'::uuid
) as account_is_authorized;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'portfolio-media';
```

Replace the UUID placeholder only with an existing user ID copied from Supabase Authentication. The `admin_users` query returns only counts/booleans, not account IDs. The bucket query should return exactly one row with `public = false`.

## Verify the policies

Run these inspection queries in the SQL Editor:

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'admin_users',
    'categories',
    'projects',
    'project_media',
    'project_links'
  )
order by c.relname;
```

Every listed table should show `rls_enabled = true`.

```sql
select
  function_owner.rolname as function_owner,
  table_owner.rolname as admin_users_owner,
  function_def.prosecdef as security_definer,
  function_def.proconfig as function_settings,
  has_function_privilege('anon', function_def.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', function_def.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', function_def.oid, 'EXECUTE') as service_role_can_execute,
  exists (
    select 1
    from pg_catalog.aclexplode(
      coalesce(
        function_def.proacl,
        pg_catalog.acldefault('f', function_def.proowner)
      )
    ) as acl
    where acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) as public_can_execute
from pg_catalog.pg_proc as function_def
join pg_catalog.pg_roles as function_owner
  on function_owner.oid = function_def.proowner
join pg_catalog.pg_class as admin_table
  on admin_table.oid = 'public.admin_users'::regclass
join pg_catalog.pg_roles as table_owner
  on table_owner.oid = admin_table.relowner
where function_def.oid = 'public.is_admin()'::regprocedure;
```

Expected: both owners are `postgres`, `security_definer` is true, `function_settings` contains an empty `search_path` and `row_security=off`, anon/authenticated can execute, and `service_role`/`PUBLIC` cannot. The function owner must be able to read `admin_users`; the migration checks this if the table has `FORCE ROW LEVEL SECURITY`.

```sql
select
  has_table_privilege('anon', 'public.admin_users', 'insert') as anon_can_insert,
  has_table_privilege('authenticated', 'public.admin_users', 'insert') as authenticated_can_insert,
  has_table_privilege('authenticated', 'public.admin_users', 'select') as authenticated_can_read;
```

All three results should be false. The table also intentionally has no client-facing RLS policy.

```sql
select tablename, policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('categories', 'projects', 'project_media', 'project_links')
order by tablename, policyname;

select id, name, public
from storage.buckets
where id = 'portfolio-media';
```

```sql
select c.relrowsecurity as storage_objects_rls_enabled
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects';

select policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'portfolio_media_%'
order by policyname;
```

Confirm public policies are SELECT-only, admin policies call `public.is_admin()`, the bucket has `public = false`, and `storage.objects` has RLS enabled with both the admin policies and restrictive policies for this bucket. The SQL Editor typically runs with a privileged role and bypasses RLS, so it is for inspecting setup—not for proving client restrictions. Verify behavior through Supabase with an anonymous client and a signed-in client:

- Anonymous reads return active categories and published projects, and never drafts or media/links attached only to drafts.
- Anonymous writes fail; anonymous Storage listing, upload, update, and delete fail.
- A signed-in Auth user not present in `admin_users` cannot write content or access the private bucket.
- The explicitly authorized administrator can manage categories, projects, media, links, and objects in `portfolio-media`.

No sample users or portfolio records are inserted by these migrations.
