begin;

do $$
begin
  if exists (
    select 1
    from public.categories
    group by lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g')))
    having count(*) > 1
  ) then
    raise exception
      'Equivalent category names already exist. Resolve them without deleting category records or losing project relationships, then reapply this migration.';
  end if;
end;
$$;

create unique index if not exists categories_normalized_name_key
on public.categories (
  lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g')))
);

alter table public.projects
drop constraint if exists projects_category_id_fkey;

alter table public.projects
add constraint projects_category_id_fkey
foreign key (category_id)
references public.categories (id)
on delete restrict;

insert into public.categories (name, slug, display_order)
select defaults.name, defaults.slug, defaults.display_order
from (
  values
    ('Promotional Video', 'promotional-video', 10),
    ('Advertising Shoot', 'advertising-shoot', 20),
    ('Product Advertisement', 'product-advertisement', 30),
    ('Brand Commercial', 'brand-commercial', 40),
    ('Food & Beverage Video', 'food-beverage-video', 50),
    ('Social Media Reel', 'social-media-reel', 60),
    ('Animation', 'animation', 70),
    ('Stick Animation', 'stick-animation', 80),
    ('Event Highlights', 'event-highlights', 90),
    ('Cinematic Video', 'cinematic-video', 100),
    ('Documentary', 'documentary', 110),
    ('Music Video', 'music-video', 120),
    ('Explainer Video', 'explainer-video', 130),
    ('Corporate Video', 'corporate-video', 140),
    ('Other', 'other', 150)
) as defaults(name, slug, display_order)
where not exists (
  select 1
  from public.categories as existing
  where lower(btrim(regexp_replace(existing.name, '[[:space:]]+', ' ', 'g')))
    = lower(btrim(regexp_replace(defaults.name, '[[:space:]]+', ' ', 'g')))
);

commit;
