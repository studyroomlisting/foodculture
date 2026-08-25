# migrations-reference

Read-only reference for all SQL migration files. Run the files in `supabase/` — not here.

| File | Status | Run order | Purpose |
|---|---|---|---|
| schema.sql | Active | 1st | 12 core tables, RLS, triggers |
| migration_002.sql | Active | 2nd | 12 additional tables, auth trigger |
| migration_003_security.sql | Active | 3rd | Security hardening — all RLS policy fixes |
| seed.sql | Dev/staging only | 4th | 16 restaurants, 8 influencers, sample data |

## Run order

```sql
-- In Supabase SQL Editor, paste and run each in sequence:
1. supabase/schema.sql
2. supabase/migration_002.sql
3. supabase/migration_003_security.sql
4. supabase/seed.sql   ← DEV/STAGING ONLY
```
