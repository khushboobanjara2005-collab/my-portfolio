HEAD
# Khushboo Banjara Portfolio

React and Vite portfolio with separate public and admin layouts. Supabase email/password authentication, database-backed admin route protection, project management, and private media uploads are implemented.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Local setup

```powershell
npm install
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. These are browser-visible public configuration values; never put a Supabase service-role key in frontend environment variables.

## Commands

- `npm run dev` — start the Vite development server
- `npm run build` — create the production build in `dist`
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint

## Routes

Public: `/`, `/about`, `/work`, `/contact`

Admin: `/admin/login`, `/admin`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/:projectId/edit`, `/admin/settings`

Admin routes require a Supabase session and a successful `public.is_admin()` check. Row Level Security remains the database security boundary. Create administrator accounts directly through Supabase Authentication and authorize only their existing user UUIDs in `public.admin_users`; public registration is not implemented. Apply all forward-only migrations in timestamp order before using the CMS. The media upload size limit defaults to 45 MB and is configurable with `VITE_PORTFOLIO_MEDIA_MAX_FILE_SIZE_MB`.

## Source structure

- `src/app` — route configuration
- `src/components/layout` — separate public and admin layouts
- `src/features` — auth, project, category, and media modules
- `src/pages` — public and admin route pages
- `src/lib` — shared Supabase client configuration
- `src/index.css` and `src/App.css` — design tokens, global styles, and layouts
- `supabase/migrations` — versioned database, RLS, and Storage migrations
- `supabase/README.md` — setup, administrator provisioning, and RLS verification

Netlify's SPA redirect is configured in `netlify.toml` so deep links resolve to the React app.

# Khushboo Banjara Portfolio

React and Vite portfolio with separate public and admin layouts. Supabase email/password authentication, database-backed admin route protection, project management, and private media uploads are implemented.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Local setup

```powershell
npm install
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. These are browser-visible public configuration values; never put a Supabase service-role key in frontend environment variables.

## Commands

- `npm run dev` — start the Vite development server
- `npm run build` — create the production build in `dist`
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint

## GitHub Pages deployment

Set the repository's Pages source to **GitHub Actions**. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under **Settings → Secrets and variables → Actions → Variables**. The workflow builds and deploys `dist` on pushes to `main`; it also provides a fallback for direct navigation and refreshes on client-side routes. Do not add a Supabase service-role key to frontend configuration.

## Routes

Public: `/`, `/about`, `/work`, `/contact`

Admin: `/admin/login`, `/admin`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/:projectId/edit`, `/admin/settings`

Admin routes require a Supabase session and a successful `public.is_admin()` check. Row Level Security remains the database security boundary. Create administrator accounts directly through Supabase Authentication and authorize only their existing user UUIDs in `public.admin_users`; public registration is not implemented. Apply all forward-only migrations in timestamp order before using the CMS. The media upload size limit defaults to 45 MB and is configurable with `VITE_PORTFOLIO_MEDIA_MAX_FILE_SIZE_MB`.

## Source structure

- `src/app` — route configuration
- `src/components/layout` — separate public and admin layouts
- `src/features` — auth, project, category, and media modules
- `src/pages` — public and admin route pages
- `src/lib` — shared Supabase client configuration
- `src/index.css` and `src/App.css` — design tokens, global styles, and layouts
- `supabase/migrations` — versioned database, RLS, and Storage migrations
- `supabase/README.md` — setup, administrator provisioning, and RLS verification

Netlify's SPA redirect is configured in `netlify.toml` so deep links resolve to the React app.
f3392dd (Configure GitHub Pages deployment)
