# notifications

**Description**: Per-user notification records

**TypeScript type**: `Notification` (defined in `types/database.ts`)

**Key columns**: `id,user_id,type,message,read`

**Used by**:
- See `FORM_TO_DATABASE_MAPPING.md` for all form writes to this table
- See `lib/queries.ts` for all read queries

**RLS**: See `DATABASE_SCHEMA.md` — section for this table
