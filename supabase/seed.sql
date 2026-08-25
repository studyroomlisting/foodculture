-- ============================================================================
-- FoodCulture AI — Comprehensive Seed Data v2 (Bengaluru)
-- 16 restaurants (2 per category), 8 influencers, images, reviews, deals
-- Run AFTER schema.sql and migration_002.sql
-- ============================================================================

-- ZONES
insert into zones (id, name, slug, trend_score, restaurant_count) values
  ('11111111-0000-0000-0000-000000000001','Koramangala','koramangala',98,48),
  ('11111111-0000-0000-0000-000000000002','Indiranagar','indiranagar',84,36),
  ('11111111-0000-0000-0000-000000000003','HSR Layout','hsr-layout',76,22),
  ('11111111-0000-0000-0000-000000000004','JP Nagar','jp-nagar',61,18),
  ('11111111-0000-0000-0000-000000000005','Whitefield','whitefield',58,29),
  ('11111111-0000-0000-0000-000000000006','Marathahalli','marathahalli',47,15),
  ('11111111-0000-0000-0000-000000000007','Jayanagar','jayanagar',43,21),
  ('11111111-0000-0000-0000-000000000008','MG Road','mg-road',39,17)
on conflict (id) do update set trend_score=excluded.trend_score,restaurant_count=excluded.restaurant_count;

-- CATEGORIES
insert into categories (id, name, slug, emoji, description, restaurant_count) values
  ('33333333-0000-0000-0000-000000000001','Biryani','biryani','🍛','Bengaluru''s best dum biryani and one-pot rice dishes',48),
  ('33333333-0000-0000-0000-000000000002','South Indian','south-indian','🥞','Authentic dosas, idlis, vadas and filter coffee',120),
  ('33333333-0000-0000-0000-000000000003','Street Food','street-food','🧆','Chaats, pani puri, corn, and roadside bites',67),
  ('33333333-0000-0000-0000-000000000004','Burgers','burgers','🍔','Smash patties, gourmet stacks, and loaded fries',22),
  ('33333333-0000-0000-0000-000000000005','Seafood','seafood','🦀','Fresh coastal Mangalorean and Kerala seafood in the city',15),
  ('33333333-0000-0000-0000-000000000006','Cafes','cafes','☕','Specialty coffee, all-day brunch, and coworking-friendly spots',89),
  ('33333333-0000-0000-0000-000000000007','Fine Dining','fine-dining','🍷','Premium tasting menus, curated wine and elevated experiences',18),
  ('33333333-0000-0000-0000-000000000008','Desserts','desserts','🍨','Ice cream, mithai, waffles, and decadent sweet treats',55)
on conflict (id) do update set restaurant_count=excluded.restaurant_count;

-- LOCATIONS
insert into locations (id, zone_id, name, slug, description, restaurant_count) values
  ('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','Koramangala 5th Block','koramangala-5th-block','The heart of BLR food and nightlife',38),
  ('44444444-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','Koramangala 7th Block','koramangala-7th-block','Buzzing cafes, bars and late-night spots',24),
  ('44444444-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000002','Indiranagar 12th Main','indiranagar-12th-main','Pub street and premium dining corridor',31),
  ('44444444-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000002','100 Feet Road','100-feet-road','The main strip with diverse cuisines',18),
  ('44444444-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000003','HSR Layout Sector 2','hsr-layout-sector-2','Quiet neighbourhood gems loved by locals',15),
  ('44444444-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000004','JP Nagar 7th Phase','jp-nagar-7th-phase','South Bengaluru family dining belt',12),
  ('44444444-0000-0000-0000-000000000007','11111111-0000-0000-0000-000000000005','Whitefield Main Road','whitefield-main-road','Tech-park crowd favourites',22),
  ('44444444-0000-0000-0000-000000000008','11111111-0000-0000-0000-000000000007','Jayanagar 4th Block','jayanagar-4th-block','Heritage South Indian food destination',19)
on conflict (id) do nothing;

-- RESTAURANTS (16 - 2 per category)
insert into restaurants (id,slug,name,emoji,zone_id,location_id,area_label,cuisine_tags,price_tier,avg_spend,rating,total_reviews,intelligence_score,intelligence_score_trend,status,listing_status,open_until,peak_hours,ai_brief) values
-- BIRYANI
('22222222-0000-0000-0000-000000000001','dum-biryani-house','Dum Biryani House','🍛','11111111-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000001','Koramangala 5th Block',ARRAY['Biryani','North Indian','Mughlai'],'₹₹',420,4.8,1248,94,12,'viral','approved','11:30 PM','7-10 PM','Exceptional momentum this week. Three major food influencers posted in 48 hours, driving a 340% spike in searches. Their Dum Biryani (₹320) is the most viral dish in Koramangala. Competitor restaurants are losing market share. Immediate table optimisation recommended.'),
('22222222-0000-0000-0000-000000000009','hyderabadi-dawat','Hyderabadi Dawat','🍲','11111111-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000003','Indiranagar 12th Main',ARRAY['Biryani','Hyderabadi','Mughlai'],'₹₹',480,4.6,876,82,9,'rising','approved','11:00 PM','8-11 PM','Authentic Hyderabadi dum biryani gaining strong traction on FoodCulture. The Kachchi Gosht Biryani receives consistent 5-star reviews. Weekend dinner slots filling 3 days in advance — a strong demand signal.'),
-- SOUTH INDIAN
('22222222-0000-0000-0000-000000000005','south-tiffin-house','South Tiffin House','🥞','11111111-0000-0000-0000-000000000007','44444444-0000-0000-0000-000000000008','Jayanagar 4th Block',ARRAY['South Indian','Breakfast','Tiffin'],'₹',120,4.7,2140,55,2,'active','approved','3:00 PM','7-10 AM','Heritage South Indian tiffin institution with 40+ years of legacy. Masala Dosa remains the undisputed bestseller with over 800 served daily. Steady loyal customer base. Low digital presence is the single biggest growth opportunity.'),
('22222222-0000-0000-0000-000000000010','udupi-sagar','Udupi Sagar','🍽️','11111111-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002','Koramangala 7th Block',ARRAY['South Indian','Udupi','Vegetarian'],'₹',150,4.5,1560,62,4,'active','approved','10:00 PM','12-2 PM','Pure vegetarian Udupi kitchen serving consistent quality for over 20 years. Set meal thali is the top seller. Strong lunchtime footfall from IT offices nearby. Healthy food positioning campaign is the key growth lever.'),
-- STREET FOOD
('22222222-0000-0000-0000-000000000003','street-masala-co','Street Masala Co.','🧆','11111111-0000-0000-0000-000000000003','44444444-0000-0000-0000-000000000005','HSR Layout Sector 2',ARRAY['Street Food','Chaat','Snacks'],'₹',180,4.5,436,63,5,'new','approved','9:00 PM','5-8 PM','New entrant generating organic buzz. 15 unsolicited mentions in 7 days without any influencer push. Masala Puri getting strong word-of-mouth. Ideal timing for a micro-influencer seed campaign before competitors respond.'),
('22222222-0000-0000-0000-000000000011','pani-puri-palace','Pani Puri Palace','🫙','11111111-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000001','Koramangala 5th Block',ARRAY['Street Food','Chaat','North Indian'],'₹',140,4.4,892,68,7,'rising','approved','10:00 PM','6-9 PM','Fastest-growing street food stall in Koramangala. Shots Pani Puri in 6 flavours has a 3-day delivery waiting list. Strong Instagram potential — bright colours and action-packed plating are naturally viral content.'),
-- BURGERS
('22222222-0000-0000-0000-000000000004','smash-burgers-blr','Smash Burgers BLR','🍔','11111111-0000-0000-0000-000000000005','44444444-0000-0000-0000-000000000007','Whitefield Main Road',ARRAY['Burgers','American','Fast Casual'],'₹₹',380,4.4,312,70,18,'rising','approved','11:00 PM','12-2 PM','Trend rising 40% in Whitefield this week. Smash Double appearing in multiple Instagram stories organically. Strong viral potential — recommend a creator seeding campaign in the next 7 days.'),
('22222222-0000-0000-0000-000000000012','bun-intended','Bun Intended','🫓','11111111-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000004','100 Feet Road, Indiranagar',ARRAY['Burgers','Craft Beer','American'],'₹₹₹',650,4.6,445,77,11,'rising','approved','12:00 AM','8-11 PM','Premium gourmet burger bar with craft beer pairings. Truffle Mushroom Burger is a cult favourite. Late-night crowd very strong — peak traffic 10 PM to midnight. Lifestyle influencer collab would perfectly match the audience.'),
-- SEAFOOD
('22222222-0000-0000-0000-000000000013','coastal-kitchen-blr','Coastal Kitchen BLR','🦞','11111111-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000003','Indiranagar 12th Main',ARRAY['Seafood','Coastal','Mangalorean'],'₹₹₹',750,4.7,634,84,6,'rising','approved','11:00 PM','1-3 PM','Authentic Mangalorean coast cooking with daily-fresh catch. Prawn Gassi and Neer Dosa combination going viral on Reels. Strong weekend lunch demand with 45-minute wait times — needs an influencer campaign to optimise weekday footfall.'),
('22222222-0000-0000-0000-000000000014','kerala-fish-curry-house','Kerala Fish Curry House','🐟','11111111-0000-0000-0000-000000000004','44444444-0000-0000-0000-000000000006','JP Nagar 7th Phase',ARRAY['Seafood','Kerala','South Indian'],'₹₹',480,4.5,378,65,4,'active','approved','10:30 PM','12-3 PM','Authentic Kerala banana-leaf meals with fresh backwater fish. Karimeen Pollichathu is a standout dish unavailable elsewhere in South Bengaluru. Growing steadily — digital visibility is the key unlock.'),
-- CAFES
('22222222-0000-0000-0000-000000000015','third-wave-coffee-blr','Third Wave Coffee BLR','☕','11111111-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002','Koramangala 7th Block',ARRAY['Cafe','Coffee','Brunch'],'₹₹',340,4.6,892,79,8,'rising','approved','11:00 PM','9 AM-12 PM','Third-wave specialty coffee destination with exceptional single-origin pour-overs. Avocado toast and cold brew combo is a weekend staple for Bengaluru young professionals. High aesthetic value — natural content creation location.'),
('22222222-0000-0000-0000-000000000016','the-quaint-cafe','The Quaint Cafe','🫖','11111111-0000-0000-0000-000000000008',null,'MG Road',ARRAY['Cafe','Bakery','Continental'],'₹₹',420,4.4,567,67,5,'active','approved','10:00 PM','10 AM-1 PM','Heritage cafe on MG Road with original 1960s decor. Belgian waffle with handcrafted jam is Instagram gold. Tourist and expat crowd provides year-round stability. Content collaborations historically perform very well here.'),
-- FINE DINING
('22222222-0000-0000-0000-000000000017','saffron-spice-fine','Saffron & Spice','🍷','11111111-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000004','100 Feet Road, Indiranagar',ARRAY['Fine Dining','North Indian','Mughlai'],'₹₹₹₹',2200,4.8,284,91,7,'viral','approved','11:30 PM','7:30-10:30 PM','Most-reviewed fine dining in the North Indian segment this quarter. The 7-course Mughal tasting menu has a 3-week waitlist. Chef Arjun Kapoor''s Black Dal is a legendary 72-hour preparation. Premium influencer tie-ups deliver 4x ROI vs standard campaigns.'),
('22222222-0000-0000-0000-000000000018','terrasse-blr','Terrasse','🌿','11111111-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000003','Indiranagar 12th Main',ARRAY['Fine Dining','European','Contemporary'],'₹₹₹₹',3200,4.9,142,88,5,'rising','approved','11:00 PM','7-10 PM','Contemporary European fine dining with a Bengaluru sensibility. Chef-curated seasonal tasting menu changes monthly. Open kitchen and rooftop garden setting generates exceptional social content. Top 3 most-tagged fine dining spots in Bengaluru.'),
-- DESSERTS
('22222222-0000-0000-0000-000000000019','mithai-magic','Mithai Magic','🍮','11111111-0000-0000-0000-000000000007','44444444-0000-0000-0000-000000000008','Jayanagar 4th Block',ARRAY['Desserts','Indian Sweets','Mithai'],'₹',160,4.6,1120,72,6,'active','approved','9:00 PM','5-8 PM','Premium Indian mithai shop with 60+ varieties of handcrafted sweets. Kaju Katli and Gulab Jamun are bestsellers during festive seasons. Gifting collections are a strong growth opportunity with influencer packaging content.'),
('22222222-0000-0000-0000-000000000020','iceberg-desserts','Iceberg Desserts','🍦','11111111-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000001','Koramangala 5th Block',ARRAY['Desserts','Ice Cream','Waffles'],'₹₹',280,4.5,678,75,10,'rising','approved','11:30 PM','7-10 PM','Artisan ice cream and waffle parlour leading the dessert category in Koramangala. Mango Kulfi Waffle sandwich went viral with 2.1M views across creator posts. Queue of 30+ people on weekends — strong Reel opportunity.')
on conflict (id) do update set intelligence_score=excluded.intelligence_score,intelligence_score_trend=excluded.intelligence_score_trend,status=excluded.status,listing_status=excluded.listing_status;

-- LISTING IMAGES (Unsplash food images - 2 per restaurant)
insert into listing_images (restaurant_id,storage_path,url,alt_text,is_primary,sort_order) values
('22222222-0000-0000-0000-000000000001','seed/biryani-1.jpg','https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop','Dum Biryani with saffron rice',true,0),
('22222222-0000-0000-0000-000000000001','seed/biryani-2.jpg','https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop','Biryani served on banana leaf',false,1),
('22222222-0000-0000-0000-000000000009','seed/hydbiryani-1.jpg','https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop','Hyderabadi Kachchi Gosht Biryani',true,0),
('22222222-0000-0000-0000-000000000009','seed/hydbiryani-2.jpg','https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800&auto=format&fit=crop','Restaurant warm interior',false,1),
('22222222-0000-0000-0000-000000000005','seed/dosa-1.jpg','https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop','Crispy masala dosa with chutney',true,0),
('22222222-0000-0000-0000-000000000005','seed/dosa-2.jpg','https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop','Idli sambar filter coffee spread',false,1),
('22222222-0000-0000-0000-000000000010','seed/udupi-1.jpg','https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop','Udupi thali set meal',true,0),
('22222222-0000-0000-0000-000000000010','seed/udupi-2.jpg','https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop','Filter coffee and medu vada',false,1),
('22222222-0000-0000-0000-000000000003','seed/chaat-1.jpg','https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop','Masala puri chaat platter',true,0),
('22222222-0000-0000-0000-000000000003','seed/chaat-2.jpg','https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=800&auto=format&fit=crop','Bhel puri street snack',false,1),
('22222222-0000-0000-0000-000000000011','seed/panipuri-1.jpg','https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop','Shots pani puri 6 flavours',true,0),
('22222222-0000-0000-0000-000000000011','seed/panipuri-2.jpg','https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=800&auto=format&fit=crop','Sev puri and dahi puri',false,1),
('22222222-0000-0000-0000-000000000004','seed/burger-1.jpg','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop','Smash double cheeseburger',true,0),
('22222222-0000-0000-0000-000000000004','seed/burger-2.jpg','https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&auto=format&fit=crop','Loaded fries and milkshake',false,1),
('22222222-0000-0000-0000-000000000012','seed/bunint-1.jpg','https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop','Truffle mushroom gourmet burger',true,0),
('22222222-0000-0000-0000-000000000012','seed/bunint-2.jpg','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&auto=format&fit=crop','Craft beer burger pairing',false,1),
('22222222-0000-0000-0000-000000000013','seed/seafood-1.jpg','https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&auto=format&fit=crop','Prawn gassi coastal curry',true,0),
('22222222-0000-0000-0000-000000000013','seed/seafood-2.jpg','https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop','Fresh catch display at counter',false,1),
('22222222-0000-0000-0000-000000000014','seed/kerala-1.jpg','https://images.unsplash.com/photo-1605197161470-5d6e5d7d2b40?w=800&auto=format&fit=crop','Kerala fish curry on banana leaf',true,0),
('22222222-0000-0000-0000-000000000014','seed/kerala-2.jpg','https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&auto=format&fit=crop','Karimeen pollichathu wrapped',false,1),
('22222222-0000-0000-0000-000000000015','seed/cafe-1.jpg','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop','Pour over specialty coffee',true,0),
('22222222-0000-0000-0000-000000000015','seed/cafe-2.jpg','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop','Avocado toast brunch plate',false,1),
('22222222-0000-0000-0000-000000000016','seed/quaint-1.jpg','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop','Belgian waffle with handcrafted jam',true,0),
('22222222-0000-0000-0000-000000000016','seed/quaint-2.jpg','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop','Vintage cafe interior MG Road',false,1),
('22222222-0000-0000-0000-000000000017','seed/finedine-1.jpg','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop','Mughal tasting menu plating',true,0),
('22222222-0000-0000-0000-000000000017','seed/finedine-2.jpg','https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&auto=format&fit=crop','Dal makhani slow cooked 72 hours',false,1),
('22222222-0000-0000-0000-000000000018','seed/terrasse-1.jpg','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop','Contemporary European plating',true,0),
('22222222-0000-0000-0000-000000000018','seed/terrasse-2.jpg','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop','Rooftop garden dining setting',false,1),
('22222222-0000-0000-0000-000000000019','seed/mithai-1.jpg','https://images.unsplash.com/photo-1601303516534-bf4bcef2bc06?w=800&auto=format&fit=crop','Assorted Indian mithai tray',true,0),
('22222222-0000-0000-0000-000000000019','seed/mithai-2.jpg','https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop','Kaju katli and gulab jamun',false,1),
('22222222-0000-0000-0000-000000000020','seed/iceberg-1.jpg','https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop','Mango kulfi waffle sandwich',true,0),
('22222222-0000-0000-0000-000000000020','seed/iceberg-2.jpg','https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop','Artisan ice cream display',false,1)
on conflict do nothing;

-- CATEGORY ASSIGNMENTS
insert into restaurant_categories (restaurant_id, category_id) values
('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001'),
('22222222-0000-0000-0000-000000000009','33333333-0000-0000-0000-000000000001'),
('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002'),
('22222222-0000-0000-0000-000000000010','33333333-0000-0000-0000-000000000002'),
('22222222-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000003'),
('22222222-0000-0000-0000-000000000011','33333333-0000-0000-0000-000000000003'),
('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000004'),
('22222222-0000-0000-0000-000000000012','33333333-0000-0000-0000-000000000004'),
('22222222-0000-0000-0000-000000000013','33333333-0000-0000-0000-000000000005'),
('22222222-0000-0000-0000-000000000014','33333333-0000-0000-0000-000000000005'),
('22222222-0000-0000-0000-000000000015','33333333-0000-0000-0000-000000000006'),
('22222222-0000-0000-0000-000000000016','33333333-0000-0000-0000-000000000006'),
('22222222-0000-0000-0000-000000000017','33333333-0000-0000-0000-000000000007'),
('22222222-0000-0000-0000-000000000018','33333333-0000-0000-0000-000000000007'),
('22222222-0000-0000-0000-000000000019','33333333-0000-0000-0000-000000000008'),
('22222222-0000-0000-0000-000000000020','33333333-0000-0000-0000-000000000008')
on conflict do nothing;

-- DISHES
insert into dishes (id, name, emoji, trend_label, restaurant_count) values
('55555555-0000-0000-0000-000000000001','Dum Biryani','🍛','🔥 Viral this week',48),
('55555555-0000-0000-0000-000000000002','Masala Dosa','🥞','📈 Rising fast',120),
('55555555-0000-0000-0000-000000000003','Smash Burger','🍔','🆕 Trending new',22),
('55555555-0000-0000-0000-000000000004','Prawn Gassi','🦐','🔥 Viral this week',15),
('55555555-0000-0000-0000-000000000005','Pani Puri','🫙','📈 Rising fast',67),
('55555555-0000-0000-0000-000000000006','Filter Coffee','☕','♻ Perennial favourite',89),
('55555555-0000-0000-0000-000000000007','Kaju Katli','🍮','🎉 Festive favourite',55),
('55555555-0000-0000-0000-000000000008','Truffle Waffle','🧇','🆕 Trending new',12),
('55555555-0000-0000-0000-000000000009','Crab Masala','🦀','🔥 Viral this week',8),
('55555555-0000-0000-0000-000000000010','Dal Makhani','🫕','♻ Perennial favourite',45),
('55555555-0000-0000-0000-000000000011','Avocado Toast','🥑','📈 Rising fast',32),
('55555555-0000-0000-0000-000000000012','Kulfi Sandwich','🍦','🔥 Viral this week',6)
on conflict (id) do nothing;

insert into restaurant_dishes (restaurant_id, dish_id) values
('22222222-0000-0000-0000-000000000001','55555555-0000-0000-0000-000000000001'),
('22222222-0000-0000-0000-000000000001','55555555-0000-0000-0000-000000000010'),
('22222222-0000-0000-0000-000000000009','55555555-0000-0000-0000-000000000001'),
('22222222-0000-0000-0000-000000000005','55555555-0000-0000-0000-000000000002'),
('22222222-0000-0000-0000-000000000005','55555555-0000-0000-0000-000000000006'),
('22222222-0000-0000-0000-000000000010','55555555-0000-0000-0000-000000000002'),
('22222222-0000-0000-0000-000000000010','55555555-0000-0000-0000-000000000006'),
('22222222-0000-0000-0000-000000000003','55555555-0000-0000-0000-000000000005'),
('22222222-0000-0000-0000-000000000011','55555555-0000-0000-0000-000000000005'),
('22222222-0000-0000-0000-000000000004','55555555-0000-0000-0000-000000000003'),
('22222222-0000-0000-0000-000000000012','55555555-0000-0000-0000-000000000003'),
('22222222-0000-0000-0000-000000000013','55555555-0000-0000-0000-000000000004'),
('22222222-0000-0000-0000-000000000013','55555555-0000-0000-0000-000000000009'),
('22222222-0000-0000-0000-000000000014','55555555-0000-0000-0000-000000000004'),
('22222222-0000-0000-0000-000000000015','55555555-0000-0000-0000-000000000006'),
('22222222-0000-0000-0000-000000000015','55555555-0000-0000-0000-000000000011'),
('22222222-0000-0000-0000-000000000016','55555555-0000-0000-0000-000000000008'),
('22222222-0000-0000-0000-000000000016','55555555-0000-0000-0000-000000000006'),
('22222222-0000-0000-0000-000000000017','55555555-0000-0000-0000-000000000010'),
('22222222-0000-0000-0000-000000000019','55555555-0000-0000-0000-000000000007'),
('22222222-0000-0000-0000-000000000020','55555555-0000-0000-0000-000000000012')
on conflict do nothing;

-- INFLUENCERS (8)
insert into influencers (id,slug,name,handle,platform,avatar_initials,followers_count,cuisine_tags,bio,impact_score,trust_score,engagement_rate,visits_driven_weekly,connection_fee,rank) values
('66666666-0000-0000-0000-000000000001','rahul-kitchens','Rahul Kitchens','@rahulkitchens','both','RK',285000,ARRAY['Biryani','North Indian','Street Food'],'Bengaluru most-trusted food creator. Known for honest restaurant reviews that directly drive foot traffic. Featured in Times Food and Zomato Top Creator 2024.',92,88,8.4,340,15000,1),
('66666666-0000-0000-0000-000000000002','spice-and-fork','Spice and Fork','@spiceandfork','instagram','SF',210000,ARRAY['South Indian','Seafood','Chettinad'],'South India food specialist covering regional cuisines across Karnataka, Tamil Nadu and Kerala. Highly credible with a discerning foodie audience.',78,82,6.2,210,12000,2),
('66666666-0000-0000-0000-000000000003','bangalore-bites','Bangalore Bites','@bangalorebites','both','BB',180000,ARRAY['Cafe','Brunch','Continental'],'Cafe culture and brunch specialist. Audience skews 22-35 urban professionals. Weekend Pick series has strong booking conversion.',74,79,7.1,180,10000,3),
('66666666-0000-0000-0000-000000000004','curry-chronicles','Curry Chronicles','@currychronicles','youtube','CC',156000,ARRAY['Fine Dining','Mughlai','Coastal'],'Long-form food documentary creator. YouTube videos average 45K views. Deep-dive restaurant stories ideal for premium launches.',69,85,4.8,145,9000,4),
('66666666-0000-0000-0000-000000000005','street-food-diaries','Street Food Diaries','@streetfooddiaries','instagram','SD',124000,ARRAY['Street Food','Chaat','Budget'],'Bengaluru street food authority. Covers carts, small joints and hidden gems that mainstream creators miss. Massive credibility with local foodies.',66,91,9.2,128,7000,5),
('66666666-0000-0000-0000-000000000006','dessert-queen-blr','Dessert Queen BLR','@dessertqueenblr','instagram','DQ',98000,ARRAY['Desserts','Cafe','Bakes'],'Dessert and patisserie specialist. Known for the sweetest content on Bengaluru food Instagram. Strong festive and gifting campaign track record.',61,77,10.1,95,6000,6),
('66666666-0000-0000-0000-000000000007','the-burger-guy','The Burger Guy','@theburgerguybengaluru','both','BG',87000,ARRAY['Burgers','Fast Casual','American'],'Bengaluru only dedicated burger reviewer. Very influential in the 18-28 male demographic — exactly who fills burger joints on weekends.',58,72,11.4,84,5500,7),
('66666666-0000-0000-0000-000000000008','healthy-plates-blr','Healthy Plates BLR','@healthyplatesblr','instagram','HP',72000,ARRAY['Cafe','Health','Vegan'],'Health-conscious food creator with a highly engaged wellness audience. Covers clean cafes, plant-based menus, and nutrition-forward restaurants.',54,80,12.8,68,4500,8)
on conflict (id) do update set rank=excluded.rank,impact_score=excluded.impact_score;

-- INFLUENCER PRICING TIERS
insert into influencer_pricing_tiers (influencer_id, tier_name, price, deliverables, estimated_reach, turnaround_days) values
('66666666-0000-0000-0000-000000000001','Story + Reel',12000,ARRAY['2 Instagram Stories','1 Reel (60s)','1 Google review'],'120K-180K',5),
('66666666-0000-0000-0000-000000000001','Full Campaign',35000,ARRAY['3 Stories','1 Reel','1 YouTube Short','1 Blog post','Newsletter feature'],'250K-350K',10),
('66666666-0000-0000-0000-000000000002','Story + Reel',9500,ARRAY['2 Stories','1 Reel (45s)','1 Highlight save'],'90K-130K',4),
('66666666-0000-0000-0000-000000000002','Full Campaign',22000,ARRAY['4 Stories','1 Reel','1 Static post','Food blog feature'],'180K-250K',8),
('66666666-0000-0000-0000-000000000003','Story + Reel',8000,ARRAY['2 Stories','1 Reel (30s)','Location tag post'],'75K-110K',3),
('66666666-0000-0000-0000-000000000003','Full Campaign',18000,ARRAY['5 Stories','1 Reel','1 Carousel','Weekend pick feature'],'150K-200K',7),
('66666666-0000-0000-0000-000000000004','Mini Doc',15000,ARRAY['1 YouTube video (8-12 min)','2 Shorts','Instagram cross-post'],'50K-90K',14),
('66666666-0000-0000-0000-000000000004','Full Campaign',28000,ARRAY['1 Full doc','4 Shorts','3 Instagram posts','Newsletter'],'130K-200K',21),
('66666666-0000-0000-0000-000000000005','Story + Reel',5500,ARRAY['3 Stories','1 Reel','Street food highlight'],'55K-80K',3),
('66666666-0000-0000-0000-000000000005','Full Campaign',12000,ARRAY['5 Stories','2 Reels','1 Guide post'],'100K-140K',6),
('66666666-0000-0000-0000-000000000006','Story + Reel',4500,ARRAY['2 Stories','1 Reel (dessert focus)','1 Unboxing reel'],'45K-65K',3),
('66666666-0000-0000-0000-000000000006','Full Campaign',10000,ARRAY['4 Stories','2 Reels','Gift box review'],'80K-110K',6),
('66666666-0000-0000-0000-000000000007','Story + Reel',4000,ARRAY['2 Stories','1 Reel','Burger rating card post'],'38K-55K',2),
('66666666-0000-0000-0000-000000000007','Full Campaign',9000,ARRAY['3 Stories','2 Reels','1 Ranking post','Community poll'],'70K-100K',5),
('66666666-0000-0000-0000-000000000008','Story + Reel',3500,ARRAY['2 Stories','1 Reel (health focus)','Macro breakdown post'],'32K-48K',3),
('66666666-0000-0000-0000-000000000008','Full Campaign',8000,ARRAY['4 Stories','2 Reels','1 Nutrition guide post'],'60K-85K',6)
on conflict do nothing;

-- INFLUENCER POSTS
insert into influencer_restaurant_posts (influencer_id, restaurant_id, platform, caption, views, likes, comments, visits_driven, posted_at) values
('66666666-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','instagram','Tried the Dum Biryani at Dum Biryani House and I am genuinely speechless. 4 hours of slow cooking, whole spices, and the freshest mutton in Bengaluru. The crust on the bottom? Absolutely perfect. Rush there.',420000,38200,1840,340,now() - interval '2 days'),
('66666666-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000013','instagram','Prawn Gassi at Coastal Kitchen BLR is the real deal. Chef sources prawns fresh from Mangalore daily. Neer Dosa pairing is mandatory. This is the coastal Mangalorean cooking Bengaluru has been waiting for.',185000,14600,620,210,now() - interval '4 days'),
('66666666-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000015','instagram','My new weekend ritual: pour-over at Third Wave Coffee BLR. The Ethiopia Yirgacheffe is extraordinary. And the avocado toast with chilli flakes here? Unmissable. Calm, aesthetic, essential.',142000,11200,480,180,now() - interval '1 day'),
('66666666-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000017','youtube','Shot a full documentary on Saffron and Spice. The 7-course Mughal tasting menu is the most ambitious culinary project in Bengaluru. Chef Arjun Dal Makhani is cooked for 72 hours. I have never eaten anything quite like it.',89000,7800,340,145,now() - interval '6 days'),
('66666666-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000011','instagram','Street food royalty: Pani Puri Palace 6-flavour shots are genuinely the best pani puri in Bengaluru. The raw mango jaljeera hits different. Queue is long but completely worth it.',96000,9400,560,128,now() - interval '3 days'),
('66666666-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000020','instagram','The Mango Kulfi Waffle Sandwich at Iceberg Desserts is the dessert of the summer. Warm waffle, frozen kulfi, mango compote. 10 out of 10 no notes. Queue is 40 people long on weekends and it is WORTH IT.',78000,8900,720,95,now() - interval '5 days'),
('66666666-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000012','instagram','Bun Intended Truffle Mushroom Burger is in my top 3 Bengaluru burgers ever. The brioche bun is baked in-house daily. Paired with their Wheat Ale it is absolutely exceptional. Go on a weeknight to skip the weekend chaos.',62000,5800,280,84,now() - interval '2 days'),
('66666666-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000015','instagram','Third Wave Coffee BLR quietly serves one of the cleanest menus in Bengaluru. Everything is thoughtfully sourced, nothing is processed. The overnight oats with seasonal fruit is a perfect balanced breakfast.',54000,5200,210,68,now() - interval '7 days')
on conflict do nothing;

-- DEALS (6)
insert into deals (restaurant_id, title, description, code, savings_label, color_theme, expires_at, active) values
('22222222-0000-0000-0000-000000000001','20% off Biryani for 2','Get 20% off any biryani for 2 people. Valid dine-in only, Monday to Thursday.','FC-DBH-20','Save Rs 180 on avg order','orange',now() + interval '15 days',true),
('22222222-0000-0000-0000-000000000013','Free Neer Dosa with Gassi','Order any prawn or fish gassi and get 2 Neer Dosas complimentary. FoodCulture exclusive.','FC-CK-DOSA','Rs 80 value, free','green',now() + interval '10 days',true),
('22222222-0000-0000-0000-000000000015','Buy 2 coffees get 1 free','Order any 2 specialty coffees and get a third of equal or lesser value free.','FC-TWC-B2G1','Save Rs 200-350','purple',now() + interval '30 days',true),
('22222222-0000-0000-0000-000000000017','Complimentary amuse-bouche','Mention FoodCulture AI and receive a chef complimentary amuse-bouche before your meal.','FC-SS-CHEF','Rs 400 value, free','orange',now() + interval '20 days',true),
('22222222-0000-0000-0000-000000000020','Free scoop with waffle','Order any waffle and get a free scoop of single-origin ice cream.','FC-IB-SCOOP','Save Rs 120','green',now() + interval '7 days',true),
('22222222-0000-0000-0000-000000000012','Rs 200 off orders above Rs 1000','Use at checkout for Rs 200 off any table order above Rs 1,000. Valid Friday to Sunday.','FC-BI-200','Save Rs 200','purple',now() + interval '14 days',true)
on conflict do nothing;

-- REVIEWS (16 - 1 per restaurant)
insert into reviews (restaurant_id, reviewer_name, rating, body, verified_visit) values
('22222222-0000-0000-0000-000000000001','Arjun Kapoor',5,'Best biryani in Bengaluru, full stop. The dum process is absolutely authentic. Rice is perfectly cooked and the mutton just falls off the bone. Queue moves fast.',true),
('22222222-0000-0000-0000-000000000001','Priya Menon',5,'Came after seeing Rahul Kitchens reel and was absolutely not disappointed. The biryani is everything. Staff are friendly and space is clean.',true),
('22222222-0000-0000-0000-000000000009','Meera Nair',5,'The Kachchi Gosht Biryani here is extraordinarily good. Properly marinated overnight. Each grain of rice is distinct. Better than anything I have had in Hyderabad itself.',true),
('22222222-0000-0000-0000-000000000005','Sathish Kumar',5,'My breakfast every Saturday for 3 years. Masala dosa crust is perfectly crisp, sambar is homestyle. Never changes, always perfect.',true),
('22222222-0000-0000-0000-000000000010','Divya Rao',4,'Proper South Indian tiffin. No frills, no fusion, just honest excellent food. The filter coffee at the end of a meal here is one of Bengaluru great simple pleasures.',true),
('22222222-0000-0000-0000-000000000003','Rahul S',4,'Really good masala puri. Fresh ingredients, generous portions, and the green chutney is housemade. Prices are very fair. Will return.',false),
('22222222-0000-0000-0000-000000000011','Aisha K',5,'The 6-flavour pani puri shots are genius. Raw mango jaljeera is my absolute favourite. Queue is worth every minute.',true),
('22222222-0000-0000-0000-000000000004','Shruti M',4,'Really good smash burger. Perfect crust, juicy centre. Fries are excellent. Service is quick and friendly.',true),
('22222222-0000-0000-0000-000000000012','Varun Mehta',5,'Truffle Mushroom Burger is a masterpiece. Brioche bun baked fresh, truffle aioli is housemade, mushroom blend is complex and rich. Best burger in Indiranagar.',true),
('22222222-0000-0000-0000-000000000013','Aakash Patel',5,'Prawn Gassi is phenomenal. Coconut base is rich, prawns are fresh and plump. Neer Dosa soaks up the curry beautifully. Best coastal food in Bengaluru.',true),
('22222222-0000-0000-0000-000000000014','Sneha DS',5,'From Mangalore originally and this is the real thing. Chef has clearly grown up eating this food. Bangda fry is crispy perfection.',true),
('22222222-0000-0000-0000-000000000015','Kiran Bhat',5,'The pour-over here changed my understanding of coffee. Ethiopia Yirgacheffe is extraordinary. Very knowledgeable baristas who actually care.',true),
('22222222-0000-0000-0000-000000000016','Ankita J',4,'Beautiful cafe to work from. Great wifi, excellent coffee, and the avocado toast is genuinely the best in Koramangala. Gets noisy on weekend mornings.',false),
('22222222-0000-0000-0000-000000000017','Sameer Anand',5,'The 7-course Mughal menu is a once-in-a-lifetime dining experience in Bengaluru. The Dal Makhani alone is worth the price. Impeccable service.',true),
('22222222-0000-0000-0000-000000000018','Radhika Nair',5,'Celebrated our anniversary here. Chef came to our table personally. Every course was outstanding. Wine pairings were thoughtfully curated. Perfection.',true),
('22222222-0000-0000-0000-000000000019','Tejas Rao',4,'Premium mithai shop. The Kaju Katli is the best in South Bengaluru. Gift boxes are beautifully presented. Highly recommend for Diwali gifts.',true),
('22222222-0000-0000-0000-000000000020','Nandini K',5,'The Mango Kulfi Waffle Sandwich is a genuinely great dessert invention. Warm waffle, cold kulfi, mango compote ties it together. Worth the queue.',true)
on conflict do nothing;

-- ACTIVITY FEED
insert into activity_feed (message, dot_color) values
('<strong>Rahul Kitchens</strong> posted a new Reel about <strong>Dum Biryani House</strong> — 420K views in 2 hours','#E85D26'),
('<strong>Prawn Gassi</strong> is trending #1 in Indiranagar this week','#F5A623'),
('<strong>Iceberg Desserts</strong> Mango Kulfi Sandwich went viral — 2.1M total views','#E85D26'),
('<strong>Saffron and Spice</strong> AI Score jumped +7 — now ranked #1 Fine Dining in Bengaluru','#2E9E55'),
('<strong>Bun Intended</strong> received 14 new 5-star reviews this week','#7F77DD'),
('<strong>Spice and Fork</strong> posted about <strong>Coastal Kitchen BLR</strong> — 185K views','#F5A623'),
('<strong>South Tiffin House</strong> crossed 2,000 total reviews on FoodCulture AI','#2E9E55'),
('<strong>Third Wave Coffee BLR</strong> trending in Cafes category — 8 new creator mentions','#E85D26'),
('<strong>Street Food Diaries</strong> featured <strong>Pani Puri Palace</strong> — queue doubled overnight','#F5A623'),
('<strong>Hyderabadi Dawat</strong> scores 82 on AI Intelligence — rising fast in Indiranagar','#2E9E55')
on conflict do nothing;
