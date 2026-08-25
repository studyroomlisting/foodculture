# 05-database — FoodCulture AI Database Reference

This folder is **documentation and reference only**. It is not executable.

The official executable SQL files are in `supabase/`.

---

## What this folder contains

| File / Folder | Purpose |
|---|---|
| `README.md` | This file — how to set up and understand the database |
| `RUN_ORDER.md` | Exact order to run SQL files in Supabase |
| `DATABASE_SCHEMA.md` | Every table, column, type, constraint, index, RLS policy |
| `FORM_TO_DATABASE_MAPPING.md` | Every form field → table → column → type → RLS |
| `ERD.md` | Entity-relationship diagram and relationship explanations |
| `TABLES/` | One .md file per table |
| `verification/` | Safe SELECT queries to verify data after setup |
| `seeds/` | Reference documentation for seed data |
| `rollback/` | Rollback guidance |
| `archive/` | Old schema files — never run again |
| `migrations-reference/` | Read-only copies of official migrations |

---

## How to set up the database

**Step 1 — Create a Supabase project**
1. Go to [supabase.com](https://supabase.com) → New project
2. Note your Project URL and anon key (Settings → API)

**Step 2 — Run SQL files in this exact order**
See `RUN_ORDER.md` for the exact sequence.

Open Supabase → SQL Editor → paste and run each file.

**Step 3 — Configure environment variables**
```
cp .env.example .env.local
# Fill in:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # optional, server-side only
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Step 4 — Create Supabase Storage bucket**
1. Supabase → Storage → New bucket
2. Name: `listing-images`
3. Public: Yes (for restaurant photos)
4. Set file size limit to 10MB

**Step 5 — Configure Supabase Auth**
1. Supabase → Authentication → URL Configuration
2. Site URL: your production domain
3. Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-domain.com/auth/callback`
4. For Google OAuth: Authentication → Providers → Google → enable, add client ID and secret

**Step 6 — Run dev server**
```bash
npm install
npm run dev
```

---

## How to inspect data in Supabase

- **Table Editor**: Supabase → Table Editor → pick table → browse rows
- **SQL Editor**: Supabase → SQL Editor → run verification queries from `verification/`

---

## Database technology

- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password, Google OAuth, magic link)
- **Storage**: Supabase Storage (`listing-images` bucket)
- **ORM**: Supabase JS client (`@supabase/supabase-js`)
- **RLS**: Row Level Security enabled on all private tables

---

## How to add a database change

1. Write the SQL in a new file in `supabase/` (e.g. `migration_003.sql`)
2. Run it in Supabase SQL Editor
3. Update `DATABASE_SCHEMA.md`, `FORM_TO_DATABASE_MAPPING.md`, and `ERD.md`
4. Add verification query to `verification/`
5. Update `RUN_ORDER.md`

---

## Source of truth

| Item | Location |
|---|---|
| Executable SQL | `supabase/schema.sql`, `supabase/migration_002.sql`, `supabase/seed.sql` |
| TypeScript types | `types/database.ts` |
| Query helpers | `lib/queries.ts` |
| Auth helpers | `lib/auth.ts` |
| Storage helpers | `lib/storage.ts` |
| SEO helpers | `lib/seo.ts` |
