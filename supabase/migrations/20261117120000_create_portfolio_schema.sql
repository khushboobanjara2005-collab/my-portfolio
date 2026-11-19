begin;

create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique
    check (char_length(slug) <= 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  is_active boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  slug text not null unique
    check (char_length(slug) <= 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  project_date date,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  published_at timestamptz
);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  media_type text not null check (
    media_type in ('youtube', 'instagram', 'uploaded_video', 'uploaded_image')
  ),
  media_url text,
  storage_path text,
  thumbnail_url text,
  alt_text text,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default pg_catalog.now(),
  constraint project_media_source_matches_type check (
    (
      media_type in ('youtube', 'instagram')
      and media_url is not null
      and media_url ~* '^https?://[^[:space:]]+$'
      and storage_path is null
    )
    or (
      media_type in ('uploaded_video', 'uploaded_image')
      and storage_path is not null
      and char_length(btrim(storage_path)) > 0
      and media_url is null
    )
  ),
  constraint project_media_thumbnail_is_http_url check (
    thumbnail_url is null or thumbnail_url ~* '^https?://[^[:space:]]+$'
  )
);

create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 120),
  url text not null check (url ~* '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default pg_catalog.now()
);

create index categories_active_order_idx
  on public.categories (display_order, name)
  where is_active;

create index projects_public_order_idx
  on public.projects (display_order, published_at desc)
  where status = 'published';

create index projects_public_featured_order_idx
  on public.projects (display_order)
  where status = 'published' and is_featured;

create index projects_public_category_order_idx
  on public.projects (category_id, display_order)
  where status = 'published';

create index projects_category_id_idx
  on public.projects (category_id);

create index project_media_project_order_idx
  on public.project_media (project_id, display_order);

create index project_links_project_idx
  on public.project_links (project_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create function public.set_project_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' then
      new.published_at := pg_catalog.now();
    else
      new.published_at := null;
    end if;
    return new;
  end if;

  new.updated_at := pg_catalog.now();

  if new.status = 'published' and old.status <> 'published' then
    new.published_at := pg_catalog.now();
  elsif new.status = 'draft' then
    new.published_at := null;
  else
    new.published_at := old.published_at;
  end if;

  return new;
end;
$$;

create trigger projects_set_timestamps
before insert or update on public.projects
for each row execute function public.set_project_timestamps();

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.project_links enable row level security;

revoke all privileges on table
  public.admin_users,
  public.categories,
  public.projects,
  public.project_media,
  public.project_links
from public, anon, authenticated;

commit;
