-- Run after schema.sql + migration_002.sql
-- Verifies all 24 tables exist

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns c 
        WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 24 tables including zones, restaurants, profiles, audit_logs, etc.
