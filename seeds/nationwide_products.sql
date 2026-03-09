-- Seed Data: Nationwide Sellers & Products (Philippines)
-- Date: 2026-03-09
-- Total sellers: 15 (one per major city/region)
-- Total products: ~135 (mixed fruits, vegetables, meats, dairy)
-- Note: No images used (image_url = NULL)
-- Requires: product_types.sql and mock_users.sql to be seeded first

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

-- ============================================================
-- NEW SELLERS ACROSS THE PHILIPPINES
-- (password for all: 'password123')
-- ============================================================

INSERT INTO users (
  name, email, password_hash, type,
  location, address, preferences, email_verified, created_at
) VALUES
  (
    'Cebu Fresh Finds',
    'cebu.freshfinds@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Cebu City, Cebu',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-10-01T08:00:00Z'
  ),
  (
    'Davao Organic Farms',
    'davao.organicfarms@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Davao City, Davao del Sur',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-10-05T08:00:00Z'
  ),
  (
    'Baguio Highlands Market',
    'baguio.highlands@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'Baguio City, Benguet',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-09-15T08:00:00Z'
  ),
  (
    'Iloilo Fresh Harvest',
    'iloilo.freshharvest@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City, Iloilo',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-11-01T08:00:00Z'
  ),
  (
    'CDO Harvest Hub',
    'cdo.harvesthub@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cagayan de Oro City, Misamis Oriental',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-11-10T08:00:00Z'
  ),
  (
    'Batangas Agrimarket',
    'batangas.agrimarket@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City, Batangas',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-09-20T08:00:00Z'
  ),
  (
    'Pampanga Fresh Hub',
    'pampanga.freshhub@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-10-12T08:00:00Z'
  ),
  (
    'Ilocos Heritage Farms',
    'ilocos.heritage@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-08-30T08:00:00Z'
  ),
  (
    'Bacolod Sweet Harvest',
    'bacolod.sweetharvest@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Bacolod City, Negros Occidental',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-11-05T08:00:00Z'
  ),
  (
    'GenSan Fresh Market',
    'gensan.freshmarket@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City, South Cotabato',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-12-01T08:00:00Z'
  ),
  (
    'Zamboanga Harvest Depot',
    'zamboanga.harvest@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City, Zamboanga del Sur',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-12-10T08:00:00Z'
  ),
  (
    'Tacloban Fresh Corner',
    'tacloban.freshcorner@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City, Leyte',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-11-20T08:00:00Z'
  ),
  (
    'Palawan Green Market',
    'palawan.greenmarket@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City, Palawan',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-12-15T08:00:00Z'
  ),
  (
    'Naga City Fresh Picks',
    'naga.freshpicks@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-10-25T08:00:00Z'
  ),
  (
    'Dumaguete Organic Corner',
    'dumaguete.organic@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true, '2025-11-15T08:00:00Z'
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PRODUCTS: CEBU FRESH FINDS (Cebu City)
-- Known for: mangoes, pineapples, coconuts, pork (lechon)
-- ============================================================

INSERT INTO products (
  seller_id, product_type_id, days_already_used, listed_date,
  price, quantity, unit, location, address,
  storage_condition, description, image_url, status
) VALUES
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    265, 1, '2026-03-08T06:00:00Z',
    80, 5, 'kg',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated_opened',
    'Sweet Carabao mangoes from Cebu farms — already ripe and ready to eat.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    267, 2, '2026-03-07T06:30:00Z',
    55, 8, 'pcs',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated',
    'Fresh Queen pineapples from Cebu highlands, sweet and tangy.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    258, 0, '2026-03-09T05:00:00Z',
    35, 20, 'pcs',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated_opened',
    'Freshly harvested young coconuts — great for buko juice.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    262, 1, '2026-03-08T07:00:00Z',
    40, 3, 'kg',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated',
    'Local guava from Cebu, perfect for juice and jam.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    284, 2, '2026-03-07T08:00:00Z',
    30, 4, 'kg',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated_opened',
    'Fresh eggplant (talong), great for torta and adobo.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    548, 1, '2026-03-08T09:00:00Z',
    25, 2, 'kg',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated_opened',
    'Mixed hot peppers (siling labuyo and siling mahaba).',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    60, 1, '2026-03-08T10:00:00Z',
    280, 2, 'kg',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated_opened',
    'Fresh pork belly (liempo) — perfect for Cebu lechon.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cebu.freshfinds@email.com'),
    295, 0, '2026-03-09T06:00:00Z',
    50, 3, 'kg',
    ST_SetSRID(ST_MakePoint(123.8854, 10.3157), 4326),
    'Carbon Market, Cebu City',
    'refrigerated_opened',
    'Local red and white onions, freshly harvested.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: DAVAO ORGANIC FARMS (Davao City)
-- Known for: bananas, pomelo, dragon fruit, tuna, durian
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    251, 0, '2026-03-09T05:30:00Z',
    35, 10, 'kg',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated',
    'Organic Lakatan bananas from Davao farms, freshly harvested.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    480, 2, '2026-03-07T06:00:00Z',
    120, 6, 'pcs',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated_opened',
    'Red dragon fruit (pitaya) from Davao organic farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    265, 1, '2026-03-08T06:00:00Z',
    90, 4, 'kg',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated_opened',
    'Ripe papaya and Indian mango from Davao highlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    250, 3, '2026-03-06T07:00:00Z',
    75, 5, 'pcs',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated',
    'Fresh Hass avocados — creamy and butter-smooth.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    267, 1, '2026-03-08T07:00:00Z',
    50, 6, 'pcs',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated',
    'Davao pineapples — large, sweet, low acid.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    305, 2, '2026-03-07T08:00:00Z',
    45, 4, 'kg',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated_opened',
    'Fresh gabi (taro root), perfect for sinigang.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    308, 1, '2026-03-08T09:00:00Z',
    30, 5, 'kg',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated_opened',
    'Freshly dug cassava (kamoteng kahoy) from organic farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'davao.organicfarms@email.com'),
    113, 0, '2026-03-09T06:00:00Z',
    220, 10, 'pcs',
    ST_SetSRID(ST_MakePoint(125.6087, 7.0707), 4326),
    'Bankerohan Market, Davao City',
    'refrigerated_opened',
    'Free-range whole chicken from Davao farm — dressed and ready.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: BAGUIO HIGHLANDS MARKET (Baguio City)
-- Known for: strawberries, vegetables, highland produce
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    481, 0, '2026-03-09T05:00:00Z',
    180, 2, 'kg',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Freshly picked Baguio strawberries from La Trinidad.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    279, 1, '2026-03-08T06:00:00Z',
    60, 3, 'kg',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Organic highland carrots from Benguet farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    276, 1, '2026-03-08T07:00:00Z',
    90, 3, 'heads',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Fresh Baguio broccoli, crisp and full of flavor.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    278, 2, '2026-03-07T07:00:00Z',
    55, 6, 'heads',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Tight, firm Baguio cabbage heads.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    297, 2, '2026-03-07T08:00:00Z',
    70, 5, 'kg',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Freshly dug Baguio potatoes from highland farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    280, 1, '2026-03-08T09:00:00Z',
    85, 4, 'heads',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Premium white cauliflower, tight curds.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    290, 0, '2026-03-09T06:00:00Z',
    45, 5, 'heads',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Crisp iceberg lettuce, harvested this morning.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    423, 0, '2026-03-09T07:00:00Z',
    55, 4, 'bundles',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Fresh kale bundles — great for salads and smoothies.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'baguio.highlands@email.com'),
    491, 1, '2026-03-08T10:00:00Z',
    65, 4, 'bags',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    'La Trinidad, Benguet / Baguio City',
    'refrigerated_opened',
    'Pre-washed baby carrots, ready to snack.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: ILOILO FRESH HARVEST (Iloilo City)
-- Known for: seafood, native chicken, root crops, dinuguan
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    293, 1, '2026-03-08T06:00:00Z',
    35, 3, 'kg',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Fresh okra (lady finger), picked yesterday from local farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    284, 1, '2026-03-08T07:00:00Z',
    30, 4, 'kg',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Long purple eggplant (talong) from Ilocos farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    302, 2, '2026-03-07T08:00:00Z',
    25, 5, 'pcs',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Fresh native squash (kalabasa), great for ginisang kalabasa.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    305, 1, '2026-03-08T09:00:00Z',
    40, 4, 'kg',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Taro (gabi) — perfect for sinigang and laing.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    286, 0, '2026-03-09T06:00:00Z',
    50, 2, 'kg',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Fresh ginger root (luya), aromatic and pungent.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    422, 2, '2026-03-07T10:00:00Z',
    45, 6, 'kg',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'pantry_opened',
    'Sweet native kamote (yam), perfect for kakanin.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    282, 0, '2026-03-09T05:30:00Z',
    20, 10, 'pcs',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Sweet corn on the cob, harvested this morning.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'iloilo.freshharvest@email.com'),
    600, 1, '2026-03-08T11:00:00Z',
    60, 3, 'packs',
    ST_SetSRID(ST_MakePoint(122.5621, 10.7202), 4326),
    'Iloilo City Public Market, Iloilo City',
    'refrigerated_opened',
    'Cherry tomatoes (cherry size), sweet and juicy.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: CDO HARVEST HUB (Cagayan de Oro City)
-- Known for: pineapples, canned goods, poultry, corn
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    267, 1, '2026-03-08T06:00:00Z',
    50, 8, 'pcs',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated',
    'Sweet CDO pineapples from Del Monte plantation area.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    251, 0, '2026-03-09T05:00:00Z',
    30, 12, 'kg',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated',
    'Saba and Lakatan bananas from local farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    113, 0, '2026-03-09T06:00:00Z',
    230, 8, 'pcs',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated_opened',
    'Native free-range chicken (dressed), farm-fresh.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    21, 1, '2026-03-08T07:00:00Z',
    165, 5, 'dozen',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated_opened',
    'Farm eggs from free-range native chickens.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    282, 0, '2026-03-09T05:30:00Z',
    18, 15, 'pcs',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated_opened',
    'White sweet corn, just harvested from CDO farmlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    293, 1, '2026-03-08T08:00:00Z',
    32, 3, 'kg',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated_opened',
    'Tender okra, ideal for pinakbet and kare-kare.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'cdo.harvesthub@email.com'),
    265, 2, '2026-03-07T09:00:00Z',
    85, 4, 'kg',
    ST_SetSRID(ST_MakePoint(124.6319, 8.4542), 4326),
    'Cogon Market, Cagayan de Oro City',
    'refrigerated_opened',
    'Ripe yellow mango and semi-ripe papaya mix.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: BATANGAS AGRIMARKET (Batangas City)
-- Known for: beef (Batangas beef), garlic, vinegar
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    40, 1, '2026-03-08T06:00:00Z',
    450, 3, 'kg',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Premium Batangas beef sirloin steaks, freshly butchered.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    43, 1, '2026-03-08T07:00:00Z',
    320, 4, 'kg',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Freshly ground Batangas beef — perfect for burger patties and empanada.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    41, 2, '2026-03-07T08:00:00Z',
    380, 3, 'kg',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Beef stew cubes (kaldereta cut) from local Batangas cattle.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    67, 1, '2026-03-08T09:00:00Z',
    290, 3, 'kg',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Fresh pork tenderloin, lean and tender.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    285, 0, '2026-03-09T06:00:00Z',
    80, 2, 'kg',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Batangas garlic bulbs — fragrant and pungent.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    295, 1, '2026-03-08T10:00:00Z',
    55, 4, 'kg',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Red onions from the Batangas-Cavite area.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'batangas.agrimarket@email.com'),
    282, 0, '2026-03-09T05:30:00Z',
    22, 10, 'pcs',
    ST_SetSRID(ST_MakePoint(121.0583, 13.7565), 4326),
    'Batangas City Public Market, Batangas City',
    'refrigerated_opened',
    'Sweet yellow corn on the cob.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: PAMPANGA FRESH HUB (San Fernando, Pampanga)
-- Known for: pork products, longganisa, cooking ingredients
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    61, 1, '2026-03-08T06:00:00Z',
    340, 4, 'kg',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Boneless pork loin roast — perfect for Kapampangan adobo.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    63, 1, '2026-03-08T07:00:00Z',
    265, 5, 'kg',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Bone-in pork loin chops, great for inihaw and kare-kare.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    64, 2, '2026-03-07T08:00:00Z',
    250, 4, 'kg',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Boneless pork chops, quick to cook and very tender.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    67, 1, '2026-03-08T09:00:00Z',
    310, 3, 'kg',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Fresh pork tenderloin — perfect for Kapampangan dishes.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    116, 0, '2026-03-09T06:00:00Z',
    185, 8, 'packs',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Chicken cut parts (leg quarters), dressed and ready to cook.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    285, 1, '2026-03-08T10:00:00Z',
    90, 3, 'kg',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Pampanga garlic (bawang) — fragrant and fresh bulbs.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'pampanga.freshhub@email.com'),
    548, 2, '2026-03-07T11:00:00Z',
    28, 2, 'kg',
    ST_SetSRID(ST_MakePoint(120.6899, 15.0286), 4326),
    'San Fernando City, Pampanga',
    'refrigerated_opened',
    'Fresh hot peppers — sili, essential for Kapampangan cooking.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: ILOCOS HERITAGE FARMS (Laoag, Ilocos Norte)
-- Known for: garlic, onions, bagnet, longganisa, tobacco
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    285, 0, '2026-03-09T05:00:00Z',
    100, 5, 'kg',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'World-famous Ilocos garlic — aromatic, small cloves, intense flavor.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    295, 1, '2026-03-08T06:00:00Z',
    60, 6, 'kg',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'Ilocos white onions — sweeter and milder than regular onions.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    284, 2, '2026-03-07T07:00:00Z',
    28, 5, 'kg',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'Ilocos long eggplant, firm and slightly sweet.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    293, 1, '2026-03-08T08:00:00Z',
    35, 3, 'kg',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'Fresh okra from Ilocos Norte farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    302, 1, '2026-03-08T09:00:00Z',
    22, 6, 'pcs',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'Native squash (kalabasa) from Ilocos Norte.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    287, 0, '2026-03-09T06:00:00Z',
    30, 6, 'bundles',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'Mixed leafy greens (kangkong, pechay, spinach).',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    422, 3, '2026-03-06T10:00:00Z',
    42, 8, 'kg',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'pantry_opened',
    'Ilocos camote (sweet potato) — purple and orange varieties.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'ilocos.heritage@email.com'),
    63, 1, '2026-03-08T11:00:00Z',
    275, 3, 'kg',
    ST_SetSRID(ST_MakePoint(120.5968, 18.1977), 4326),
    'Laoag City, Ilocos Norte',
    'refrigerated_opened',
    'Fresh pork chops for Ilocos bagnet preparation.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: BACOLOD SWEET HARVEST (Bacolod City)
-- Known for: sugarcane, chicken inasal, seafood, tropical fruits
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    251, 0, '2026-03-09T05:30:00Z',
    28, 15, 'kg',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated',
    'Ripe Lacatan bananas from Negros Occidental farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    267, 1, '2026-03-08T06:00:00Z',
    48, 7, 'pcs',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated',
    'Ripe sweet pineapples from Negros highlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    422, 2, '2026-03-07T07:00:00Z',
    38, 8, 'kg',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'pantry_opened',
    'Sweet camote (yam) from Bacolod countryside.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    258, 1, '2026-03-08T08:00:00Z',
    32, 18, 'pcs',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated_opened',
    'Fresh young coconuts — buko water and meat ready.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    293, 1, '2026-03-08T09:00:00Z',
    30, 3, 'kg',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated_opened',
    'Fresh okra from Negros Occidental farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    265, 1, '2026-03-08T10:00:00Z',
    75, 5, 'kg',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated_opened',
    'Sweet yellow mango from Bacolod, ripe and ready.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    480, 3, '2026-03-06T11:00:00Z',
    115, 8, 'pcs',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated_opened',
    'Dragon fruit (pitaya) from Negros highlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'bacolod.sweetharvest@email.com'),
    113, 0, '2026-03-09T06:00:00Z',
    195, 12, 'pcs',
    ST_SetSRID(ST_MakePoint(122.9509, 10.6769), 4326),
    'Libertad Market, Bacolod City',
    'refrigerated_opened',
    'Native chicken for inasal — fresh dressed whole chicken.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: GENSAN FRESH MARKET (General Santos City)
-- Known for: tuna, pork, tropical produce
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    63, 1, '2026-03-08T06:00:00Z',
    270, 5, 'kg',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Fresh pork chops from local GenSan farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    113, 0, '2026-03-09T06:00:00Z',
    210, 10, 'pcs',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Dressed native chicken, fresh from local poultry farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    600, 1, '2026-03-08T07:00:00Z',
    70, 4, 'packs',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Sweet mini cherry tomatoes from South Cotabato farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    284, 1, '2026-03-08T08:00:00Z',
    28, 4, 'kg',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Long purple eggplant from GenSan hinterland farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    302, 2, '2026-03-07T09:00:00Z',
    24, 6, 'pcs',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Native squash (kalabasa) from South Cotabato.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    265, 1, '2026-03-08T10:00:00Z',
    88, 5, 'kg',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Honey sweet mango and carabao papaya just arrived.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'gensan.freshmarket@email.com'),
    305, 2, '2026-03-07T11:00:00Z',
    38, 4, 'kg',
    ST_SetSRID(ST_MakePoint(125.1716, 6.1164), 4326),
    'General Santos City Public Market, GenSan',
    'refrigerated_opened',
    'Fresh taro (gabi) from GenSan upland communities.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: ZAMBOANGA HARVEST DEPOT (Zamboanga City)
-- Known for: vinegar, tropical fruits, vinta, curacha crab
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    250, 2, '2026-03-07T06:00:00Z',
    70, 6, 'pcs',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated',
    'Creamy avocados from Zamboanga del Sur farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    251, 0, '2026-03-09T05:00:00Z',
    28, 14, 'kg',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated',
    'Sweet Saba bananas — perfect for minatamis.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    265, 1, '2026-03-08T06:00:00Z',
    80, 5, 'kg',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated_opened',
    'Mixed ripe papaya and young mango.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    258, 0, '2026-03-09T06:00:00Z',
    30, 22, 'pcs',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated_opened',
    'Fresh buko coconuts from Zamboanga farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    267, 2, '2026-03-07T07:00:00Z',
    45, 7, 'pcs',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated',
    'Zamboanga pineapples, sweet with tropical aroma.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    478, 3, '2026-03-06T08:00:00Z',
    95, 4, 'pcs',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated_opened',
    'Star fruit (carambola) — crisp and slightly tart.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'zamboanga.harvest@email.com'),
    308, 1, '2026-03-08T09:00:00Z',
    28, 8, 'kg',
    ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326),
    'Zamboanga City Public Market, Zamboanga del Sur',
    'refrigerated_opened',
    'Freshly dug cassava (kamoteng-kahoy).',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: TACLOBAN FRESH CORNER (Tacloban City, Leyte)
-- Known for: binagol, moron, root crops, seafood
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    422, 1, '2026-03-08T06:00:00Z',
    44, 8, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'pantry_opened',
    'Purple and orange camote (yam) from Leyte highlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    305, 1, '2026-03-08T07:00:00Z',
    42, 5, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'refrigerated_opened',
    'Taro root (gabi) from Leyte lowlands — for laing and sinigang.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    308, 2, '2026-03-07T08:00:00Z',
    25, 7, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'refrigerated_opened',
    'Freshly harvested cassava from Tacloban countryside.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    293, 1, '2026-03-08T09:00:00Z',
    30, 3, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'refrigerated_opened',
    'Fresh okra pods, tender and slender.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    284, 2, '2026-03-07T10:00:00Z',
    27, 4, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'refrigerated_opened',
    'Long eggplant from Leyte farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    251, 0, '2026-03-09T05:30:00Z',
    26, 12, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'refrigerated',
    'Saba bananas from Leyte — great for banana cue.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'tacloban.freshcorner@email.com'),
    286, 1, '2026-03-08T11:00:00Z',
    48, 2, 'kg',
    ST_SetSRID(ST_MakePoint(125.0016, 11.2542), 4326),
    'Tacloban City Public Market, Leyte',
    'refrigerated_opened',
    'Aromatic ginger root, freshly harvested.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: PALAWAN GREEN MARKET (Puerto Princesa, Palawan)
-- Known for: honey, cashews, exotic tropical fruits, seafood
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    480, 2, '2026-03-07T06:00:00Z',
    130, 7, 'pcs',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Palawan dragon fruit (pitaya rosa) — thick skin, sweet flesh.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    258, 0, '2026-03-09T05:00:00Z',
    30, 25, 'pcs',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Young coconuts (buko) from Palawan groves.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    251, 1, '2026-03-08T06:00:00Z',
    25, 14, 'kg',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated',
    'Sweet Lakatan bananas from Palawan farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    495, 3, '2026-03-06T07:00:00Z',
    120, 3, 'pcs',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Large seedless watermelon from Palawan lowlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    283, 1, '2026-03-08T08:00:00Z',
    35, 4, 'kg',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Long green cucumbers from Palawan farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    302, 1, '2026-03-08T09:00:00Z',
    22, 5, 'pcs',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Butterscotch squash from Puerto Princesa uplands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    265, 2, '2026-03-07T10:00:00Z',
    85, 4, 'kg',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Wild Palawan papaya and carabao mango mix.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'palawan.greenmarket@email.com'),
    497, 2, '2026-03-07T11:00:00Z',
    110, 3, 'pcs',
    ST_SetSRID(ST_MakePoint(118.7353, 9.7392), 4326),
    'Puerto Princesa City Market, Palawan',
    'refrigerated_opened',
    'Sweet honeydew melon, chilled and ready.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: NAGA CITY FRESH PICKS (Naga City, Camarines Sur)
-- Known for: pili nuts, bicolandia vegetables, chili
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    286, 0, '2026-03-09T06:00:00Z',
    55, 2, 'kg',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Bicol ginger root (luya), freshly harvested and fragrant.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    505, 0, '2026-03-09T07:00:00Z',
    40, 3, 'bundles',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Fresh lemongrass (tanglad) stalks from Bicol region.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    506, 0, '2026-03-09T07:30:00Z',
    25, 5, 'bundles',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Aromatic cilantro (wansoy) bundles, freshly cut.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    509, 0, '2026-03-09T08:00:00Z',
    22, 5, 'bundles',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Sweet basil (balanoy) fresh bundles.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    548, 1, '2026-03-08T09:00:00Z',
    30, 2, 'kg',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Bicol sili (hot peppers) — fiery fresh, essential for Bicol Express.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    305, 2, '2026-03-07T10:00:00Z',
    38, 4, 'kg',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Bicol gabi (taro) — staple ingredient for laing.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    258, 1, '2026-03-08T11:00:00Z',
    32, 15, 'pcs',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Bicol coconuts — base ingredient for gata dishes.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'naga.freshpicks@email.com'),
    293, 1, '2026-03-08T12:00:00Z',
    30, 3, 'kg',
    ST_SetSRID(ST_MakePoint(123.1814, 13.6192), 4326),
    'Naga City, Camarines Sur',
    'refrigerated_opened',
    'Fresh okra from Camarines Sur farms.',
    NULL, 'active'
  ),

-- ============================================================
-- PRODUCTS: DUMAGUETE ORGANIC CORNER (Dumaguete City)
-- Known for: organic produce, dairy, vegetables
-- ============================================================

  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    600, 1, '2026-03-08T06:00:00Z',
    65, 4, 'packs',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Organic cherry tomatoes from Dumaguete farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    290, 0, '2026-03-09T06:00:00Z',
    48, 6, 'heads',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Crisp green lettuce heads from organic farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    288, 0, '2026-03-09T07:00:00Z',
    35, 6, 'packs',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Mixed herb pack (thyme, rosemary, parsley, basil).',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    276, 1, '2026-03-08T08:00:00Z',
    88, 4, 'heads',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Organic broccoli from Negros Oriental highlands.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    273, 1, '2026-03-08T09:00:00Z',
    42, 3, 'kg',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Garden beans and snap peas — fresh from the farm.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    284, 2, '2026-03-07T10:00:00Z',
    27, 4, 'kg',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Slim purple eggplant from organic Dumaguete farms.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    283, 1, '2026-03-08T11:00:00Z',
    33, 3, 'kg',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Organic English cucumbers, firm and seedless.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    423, 0, '2026-03-09T08:00:00Z',
    52, 5, 'bundles',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Organic kale, rich in nutrients, cut this morning.',
    NULL, 'active'
  ),
  (
    (SELECT id FROM users WHERE email = 'dumaguete.organic@email.com'),
    21, 1, '2026-03-08T12:00:00Z',
    155, 6, 'dozen',
    ST_SetSRID(ST_MakePoint(123.3080, 9.3076), 4326),
    'Dumaguete City, Negros Oriental',
    'refrigerated_opened',
    'Free-range organic eggs from Dumaguete chicken farm.',
    NULL, 'active'
  );

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Refresh materialized view for search cache
REFRESH MATERIALIZED VIEW products_search_cache;

-- Verify counts
SELECT COUNT(*) AS new_sellers FROM users WHERE email LIKE '%freshfinds%' OR email LIKE '%organicfarms%' OR email LIKE '%highlands%' OR email LIKE '%freshharvest%' OR email LIKE '%harvesthub%' OR email LIKE '%agrimarket%' OR email LIKE '%freshhub%' OR email LIKE '%heritage%' OR email LIKE '%sweetharvest%' OR email LIKE '%freshmarket%' OR email LIKE '%harvest%' OR email LIKE '%freshcorner%' OR email LIKE '%greenmarket%' OR email LIKE '%freshpicks%' OR email LIKE '%organic%';
SELECT COUNT(*) AS total_products FROM products WHERE status = 'active';
