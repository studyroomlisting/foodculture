-- Verify Row Level Security is enabled on all sensitive tables

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should show rowsecurity = true
