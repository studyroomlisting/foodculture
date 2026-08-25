# onboarding_progress

**Description**: Owner setup tracking

**TypeScript type**: `OnboardingProgress` (defined in `types/database.ts`)

**Key columns**: `id,user_id,step_listing_submitted,step_approved`

**Used by**:
- See `FORM_TO_DATABASE_MAPPING.md` for all form writes to this table
- See `lib/queries.ts` for all read queries

**RLS**: See `DATABASE_SCHEMA.md` — section for this table
