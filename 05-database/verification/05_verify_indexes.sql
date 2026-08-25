-- Verify all performance indexes exist

SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Key indexes to confirm:
-- restaurants: slug (unique), zone_id, listing_status, owner_id
-- influencers: slug (unique), rank
-- saved_listings: user_id
-- enquiries: restaurant_id
-- audit_logs: actor_id, action, created_at
