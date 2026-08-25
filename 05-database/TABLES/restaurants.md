# restaurants

**Description**: Core listing table — every restaurant on the platform

**TypeScript type**: `Restaurant` (defined in `types/database.ts`)

**Key columns**: `id,slug,name,listing_status,intelligence_score`

**Used by**:
- See `FORM_TO_DATABASE_MAPPING.md` for all form writes to this table
- See `lib/queries.ts` for all read queries

**RLS**: See `DATABASE_SCHEMA.md` — section for this table
