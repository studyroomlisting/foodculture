-- Verify auth trigger exists

SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
   OR event_object_schema = 'auth'
ORDER BY trigger_name;

-- Should show: on_auth_user_created on auth.users
