-- Run after seed.sql
-- Verifies seed data loaded correctly

SELECT 'zones'         AS tbl, COUNT(*) AS rows FROM zones
UNION ALL
SELECT 'restaurants',           COUNT(*) FROM restaurants
UNION ALL
SELECT 'influencers',           COUNT(*) FROM influencers
UNION ALL
SELECT 'dishes',                COUNT(*) FROM dishes
UNION ALL
SELECT 'deals',                 COUNT(*) FROM deals
UNION ALL
SELECT 'reviews',               COUNT(*) FROM reviews
UNION ALL
SELECT 'categories',            COUNT(*) FROM categories
UNION ALL
SELECT 'locations',             COUNT(*) FROM locations
UNION ALL
SELECT 'influencer_pricing_tiers', COUNT(*) FROM influencer_pricing_tiers
UNION ALL
SELECT 'influencer_restaurant_posts', COUNT(*) FROM influencer_restaurant_posts
UNION ALL
SELECT 'activity_feed',         COUNT(*) FROM activity_feed
ORDER BY tbl;

-- Expected: zones=5, restaurants=5, influencers=5, deals=4, reviews=8
