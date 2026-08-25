-- Verify all form-target tables are writable (INSERT test structure)
-- These are read-only checks — do NOT run the INSERTs on production

-- Check enquiries structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'enquiries' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check connection_requests structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'connection_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check reviews structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check listing_claims structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'listing_claims' AND table_schema = 'public'
ORDER BY ordinal_position;
