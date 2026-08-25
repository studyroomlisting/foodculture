# user_roles

**Description**: Explicit role assignments

**TypeScript type**: `UserRole` (defined in `types/database.ts`)

**Key columns**: `id,user_id,role,granted_by`

**Used by**:
- See `FORM_TO_DATABASE_MAPPING.md` for all form writes to this table
- See `lib/queries.ts` for all read queries

**RLS**: See `DATABASE_SCHEMA.md` — section for this table
