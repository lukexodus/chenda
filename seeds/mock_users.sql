-- Seed Data: Mock Users
-- Date: 2026-02-09T02:56:09.724Z
-- Total users: 10
-- Default password for all users: 'password123'

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

INSERT INTO users (
  name,
  email,
  password_hash,
  type,
  location,
  address,
  preferences,
  email_verified,
  created_at
) VALUES
  (
    'Maria Santos',
    'maria.santos@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'buyer',
    ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326),
    'Quezon City, Metro Manila',
    '{"proximity_weight":60,"shelf_life_weight":40,"max_radius_km":30,"min_freshness_percent":50,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-15T08:30:00Z'
  ),
  (
    'Carlos Reyes',
    'carlos.reyes@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'buyer',
    ST_SetSRID(ST_MakePoint(121.0244, 14.5547), 4326),
    'Makati City, Metro Manila',
    '{"proximity_weight":70,"shelf_life_weight":30,"max_radius_km":20,"min_freshness_percent":60,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-18T10:15:00Z'
  ),
  (
    'Ana Garcia',
    'ana.garcia@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'buyer',
    ST_SetSRID(ST_MakePoint(121.0359, 14.5794), 4326),
    'Mandaluyong City, Metro Manila',
    '{"proximity_weight":40,"shelf_life_weight":60,"max_radius_km":50,"min_freshness_percent":70,"display_mode":"filter_sort"}'::jsonb,
    true,
    '2025-01-20T14:00:00Z'
  ),
  (
    'Roberto Cruz',
    'roberto.cruz@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'buyer',
    ST_SetSRID(ST_MakePoint(120.9626, 14.676), 4326),
    'Caloocan City, Metro Manila',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":40,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-22T09:00:00Z'
  ),
  (
    'Sofia Mendoza',
    'sofia.mendoza@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'buyer',
    ST_SetSRID(ST_MakePoint(121.0185, 14.409), 4326),
    'Parañaque City, Metro Manila',
    '{"proximity_weight":80,"shelf_life_weight":20,"max_radius_km":15,"min_freshness_percent":40,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-25T11:30:00Z'
  ),
  (
    'Juan''s Fresh Market',
    'juan.market@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(121.0223, 14.6091), 4326),
    'Pasig City, Metro Manila',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-10T10:00:00Z'
  ),
  (
    'Tindahan ni Aling Nena',
    'nena.store@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(121.0506, 14.5378), 4326),
    'Taguig City, Metro Manila',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-12T08:00:00Z'
  ),
  (
    'Manila Bay Groceries',
    'manilabaygroceries@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'seller',
    ST_SetSRID(ST_MakePoint(120.9794, 14.5833), 4326),
    'Manila City, Metro Manila',
    '{"proximity_weight":50,"shelf_life_weight":50,"max_radius_km":50,"min_freshness_percent":null,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-08T07:00:00Z'
  ),
  (
    'Linda''s Dairy Corner',
    'linda.dairy@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'both',
    ST_SetSRID(ST_MakePoint(120.9721, 14.6507), 4326),
    'Valenzuela City, Metro Manila',
    '{"proximity_weight":55,"shelf_life_weight":45,"max_radius_km":35,"min_freshness_percent":50,"display_mode":"ranking"}'::jsonb,
    true,
    '2025-01-14T09:30:00Z'
  ),
  (
    'Pedro''s Produce Hub',
    'pedro.produce@email.com',
    '$2b$10$AtjpogwC/AW9rSWwVGJs4.9nWtU.Vlw4TUtR6zN.GqP075cJI29hq',
    'both',
    ST_SetSRID(ST_MakePoint(120.9832, 14.5243), 4326),
    'Las Piñas City, Metro Manila',
    '{"proximity_weight":45,"shelf_life_weight":55,"max_radius_km":45,"min_freshness_percent":60,"display_mode":"filter_sort"}'::jsonb,
    true,
    '2025-01-16T13:00:00Z'
  );

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Update sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Verify count
SELECT COUNT(*) as users_count FROM users;

-- Show users with locations
SELECT 
  id,
  name,
  email,
  type,
  ST_X(location::geometry) as longitude,
  ST_Y(location::geometry) as latitude,
  address
FROM users;
