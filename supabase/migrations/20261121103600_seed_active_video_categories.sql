
BEGIN;

-- 1. Check for duplicate category names before creating the unique index.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.categories
        GROUP BY lower(
            btrim(
                regexp_replace(name, '[[:space:]]+', ' ', 'g')
            )
        )
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Duplicate category names detected. Resolve duplicates without deleting category records or losing project relationships.';
    END IF;
END;
$$;

-- 2. Prevent duplicate names regardless of capitalization or extra spaces.
CREATE UNIQUE INDEX IF NOT EXISTS categories_normalized_name_key
ON public.categories (
    lower(
        btrim(
            regexp_replace(name, '[[:space:]]+', ' ', 'g')
        )
    )
);

-- 3. Check whether any required slug is already used by
-- a different category name.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (
            VALUES
                ('Promotional Video', 'promotional-video'),
                ('Advertising Shoot', 'advertising-shoot'),
                ('Product Advertisement', 'product-advertisement'),
                ('Brand Commercial', 'brand-commercial'),
                ('Food & Beverage Video', 'food-beverage-video'),
                ('Social Media Reel', 'social-media-reel'),
                ('Animation', 'animation'),
                ('Stick Animation', 'stick-animation'),
                ('Event Highlights', 'event-highlights'),
                ('Cinematic Video', 'cinematic-video'),
                ('Documentary', 'documentary'),
                ('Music Video', 'music-video'),
                ('Explainer Video', 'explainer-video'),
                ('Corporate Video', 'corporate-video'),
                ('Other', 'other')
        ) AS defaults(name, slug)
        JOIN public.categories AS existing
          ON lower(existing.slug) = lower(defaults.slug)
        WHERE lower(
            btrim(
                regexp_replace(existing.name, '[[:space:]]+', ' ', 'g')
            )
        ) <> lower(
            btrim(
                regexp_replace(defaults.name, '[[:space:]]+', ' ', 'g')
            )
        )
    ) THEN
        RAISE EXCEPTION
            'A required category slug is already used by a different category. Resolve the slug conflict before running this script.';
    END IF;
END;
$$;

-- 4. Activate and standardize existing matching categories.
-- Existing IDs and project relationships are preserved.
UPDATE public.categories AS existing
SET
    name = defaults.name,
    is_active = TRUE,
    display_order = defaults.display_order
FROM (
    VALUES
        ('Promotional Video', 10),
        ('Advertising Shoot', 20),
        ('Product Advertisement', 30),
        ('Brand Commercial', 40),
        ('Food & Beverage Video', 50),
        ('Social Media Reel', 60),
        ('Animation', 70),
        ('Stick Animation', 80),
        ('Event Highlights', 90),
        ('Cinematic Video', 100),
        ('Documentary', 110),
        ('Music Video', 120),
        ('Explainer Video', 130),
        ('Corporate Video', 140),
        ('Other', 150)
) AS defaults(name, display_order)
WHERE lower(
    btrim(
        regexp_replace(existing.name, '[[:space:]]+', ' ', 'g')
    )
) = lower(
    btrim(
        regexp_replace(defaults.name, '[[:space:]]+', ' ', 'g')
    )
);

-- 5. Insert categories that do not already exist.
INSERT INTO public.categories (
    name,
    slug,
    display_order,
    is_active
)
SELECT
    defaults.name,
    defaults.slug,
    defaults.display_order,
    TRUE
FROM (
    VALUES
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
) AS defaults(name, slug, display_order)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.categories AS existing
    WHERE lower(
        btrim(
            regexp_replace(existing.name, '[[:space:]]+', ' ', 'g')
        )
    ) = lower(
        btrim(
            regexp_replace(defaults.name, '[[:space:]]+', ' ', 'g')
        )
    )
);

-- 6. Verify the seeded categories before committing.
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO category_count
    FROM public.categories
    WHERE is_active = TRUE
      AND lower(
          btrim(
              regexp_replace(name, '[[:space:]]+', ' ', 'g')
          )
      ) IN (
          'promotional video',
          'advertising shoot',
          'product advertisement',
          'brand commercial',
          'food & beverage video',
          'social media reel',
          'animation',
          'stick animation',
          'event highlights',
          'cinematic video',
          'documentary',
          'music video',
          'explainer video',
          'corporate video',
          'other'
      );

    IF category_count <> 15 THEN
        RAISE EXCEPTION
            'Expected 15 active default categories, but found %.',
            category_count;
    END IF;
END;
$$;

COMMIT;

-- 7. Display the final category list.
SELECT
    id,
    name,
    slug,
    display_order,
    is_active
FROM public.categories
WHERE is_active = TRUE
ORDER BY display_order ASC, name ASC;
