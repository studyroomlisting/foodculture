-- Check listing status distribution

SELECT listing_status, COUNT(*) AS count
FROM restaurants
GROUP BY listing_status
ORDER BY count DESC;

-- After seed: all 5 should be 'approved' (seed sets approved)

-- Test the status lifecycle query (used by admin dashboard):
SELECT id, name, listing_status, owner_id, submitted_at, approved_at
FROM restaurants
ORDER BY created_at DESC
LIMIT 10;
