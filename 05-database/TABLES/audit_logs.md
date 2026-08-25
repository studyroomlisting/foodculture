# audit_logs

**Description**: Immutable admin action history

**TypeScript type**: `AuditLog` (defined in `types/database.ts`)

**Key columns**: `id,actor_id,action,target_table,created_at`

**Used by**:
- See `FORM_TO_DATABASE_MAPPING.md` for all form writes to this table
- See `lib/queries.ts` for all read queries

**RLS**: See `DATABASE_SCHEMA.md` — section for this table
