-- Seed Data: Philippine Regional Product Types
-- Date: 2026-04-24
-- Description: Regional and local specialty product types for Philippines marketplace
-- Purpose: Expand product catalog with local specialties while maintaining USDA baseline

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

-- ============================================
-- ILOCOS REGION SPECIALTIES
-- ============================================

INSERT INTO product_types (
  id,
  name,
  name_subtitle,
  category_id,
  keywords,
  default_shelf_life_days,
  default_storage_condition,
  shelf_life_source,
  source,
  region,
  is_available_in_philippines
) VALUES

-- Ilocos Garlic (major export crop)
(
  10001,
  'Ilocos Garlic',
  'white; bulbs or cloves',
  13,
  'garlic,ilocos,bulbs,cloves,white garlic',
  180,
  'pantry',
  '{"min":4,"max":6,"metric":"Months","note":"Tropical storage in Ilocos Norte"}'::jsonb,
  'regional',
  'Ilocos Norte',
  true
),

-- Ilocos Tobacco Leaves (agricultural product)
(
  10002,
  'Tobacco Leaves',
  'dried; Ilocos variety',
  14,
  'tobacco,leaves,ilocos,dried,agricultural',
  365,
  'pantry_opened',
  '{"min":12,"max":24,"metric":"Months","note":"Dried tobacco stores well in temperate warehouse"}'::jsonb,
  'regional',
  'Ilocos Region',
  true
),

-- ============================================
-- REGIONAL TROPICAL FRUITS
-- ============================================

(
  10003,
  'Mango',
  'ripe; Philippines variety (Carabao, Ataulfo)',
  11,
  'mango,tropical,fruits,carabao,ataulfo',
  7,
  'refrigerated',
  '{"min":3,"max":7,"metric":"Days","note":"Tropical ripening, shorter shelf life than temperate varieties"}'::jsonb,
  'regional',
  'Davao, Calamansi',
  true
),

(
  10004,
  'Pineapple',
  'fresh; Philippine variety (Del Monte, local)',
  11,
  'pineapple,tropical,fruits,local',
  10,
  'refrigerated',
  '{"min":7,"max":14,"metric":"Days","note":"Tropical storage conditions"}'::jsonb,
  'regional',
  'Mindanao',
  true
),

(
  10005,
  'Calamansi',
  'fresh citrus; lime-like',
  11,
  'calamansi,citrus,lime,local,tropical',
  14,
  'pantry',
  '{"min":2,"max":4,"metric":"Weeks","note":"Philippine specialty citrus"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10006,
  'Banana (Lakatan)',
  'ripe or green; Lakatan variety',
  11,
  'banana,lakatan,tropical,fruits',
  5,
  'pantry',
  '{"min":3,"max":7,"metric":"Days","note":"Quick ripening in tropical climate"}'::jsonb,
  'regional',
  'Mindanao',
  true
),

-- ============================================
-- REGIONAL VEGETABLES
-- ============================================

(
  10007,
  'Kangkong',
  'fresh greens; water spinach',
  12,
  'kangkong,spinach,greens,vegetables,local',
  3,
  'refrigerated_opened',
  '{"min":1,"max":3,"metric":"Days","note":"Highly perishable tropical green"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10008,
  'Okra',
  'fresh; ladyfinger vegetable',
  12,
  'okra,ladyfinger,vegetables,tropical',
  4,
  'refrigerated',
  '{"min":2,"max":4,"metric":"Days","note":"Best consumed fresh in tropical climate"}'::jsonb,
  'regional',
  'Visayas',
  true
),

(
  10009,
  'Bitter Melon (Ampalaya)',
  'fresh; Asian vegetable',
  12,
  'ampalaya,bitter melon,vegetables,asian',
  7,
  'refrigerated',
  '{"min":5,"max":10,"metric":"Days","note":"Tropical storage conditions"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10010,
  'Eggplant (Talong)',
  'fresh; local variety',
  12,
  'talong,eggplant,aubergine,vegetables',
  5,
  'refrigerated',
  '{"min":3,"max":7,"metric":"Days","note":"Philippine local vegetable"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

-- ============================================
-- REGIONAL MEATS & PROTEINS
-- ============================================

(
  10011,
  'Chicken (Local Heritage)',
  'whole or pieces; native breed',
  8,
  'chicken,native,heritage,meat,local',
  2,
  'refrigerated_opened',
  '{"min":1,"max":2,"metric":"Days","note":"Must consume quickly in tropical conditions"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10012,
  'Pork (Native Pig)',
  'fresh cuts; local breed',
  9,
  'pork,native,local,meat,cuts',
  2,
  'refrigerated_opened',
  '{"min":1,"max":2,"metric":"Days","note":"Tropical storage accelerates spoilage"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10013,
  'Tilapia (Fresh)',
  'whole or filleted; freshwater fish',
  15,
  'tilapia,fish,freshwater,local,seafood',
  1,
  'refrigerated_opened',
  '{"min":0,"max":2,"metric":"Days","note":"Must consume immediately in tropical climate"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

-- ============================================
-- REGIONAL DAIRY & FERMENTED GOODS
-- ============================================

(
  10014,
  'Carabao Milk',
  'fresh; buffalo milk',
  7,
  'milk,carabao,buffalo,dairy,fresh',
  1,
  'refrigerated_opened',
  '{"min":0,"max":2,"metric":"Days","note":"Highly perishable in tropical heat"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10015,
  'Queso de Bola',
  'aged; Filipino cheese',
  7,
  'cheese,queso,bola,local,aged',
  60,
  'refrigerated_opened',
  '{"min":2,"max":3,"metric":"Months","note":"Hard cheese stores longer in tropical conditions"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

-- ============================================
-- REGIONAL SPECIALTY ITEMS
-- ============================================

(
  10016,
  'Salted Fish (Tuyo)',
  'dried and salted; traditional',
  15,
  'tuyo,salted fish,dried,traditional,seafood',
  180,
  'pantry',
  '{"min":6,"max":12,"metric":"Months","note":"Shelf-stable cured product"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10017,
  'Bagoong',
  'shrimp paste; fermented condiment',
  14,
  'bagoong,shrimp paste,fermented,condiment',
  365,
  'pantry_opened',
  '{"min":12,"max":24,"metric":"Months","note":"Fermented preserves indefinitely at room temp"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

(
  10018,
  'Sweet Potato (Kamote)',
  'fresh; root vegetable',
  12,
  'kamote,sweet potato,root vegetable,local',
  14,
  'pantry',
  '{"min":1,"max":3,"metric":"Weeks","note":"Store in cool, dark place; tropical conditions reduce lifespan"}'::jsonb,
  'regional',
  'Nationwide',
  true
),

-- ============================================
-- VISAYAS & MINDANAO SPECIALTIES
-- ============================================

(
  10019,
  'Calamansi Juice (Fresh)',
  'squeezed; local citrus juice',
  16,
  'calamansi,juice,fresh,citrus,beverage',
  7,
  'refrigerated_opened',
  '{"min":5,"max":10,"metric":"Days","note":"Fresh squeezed juice for local markets"}'::jsonb,
  'regional',
  'Visayas',
  true
),

(
  10020,
  'Coconut (Fresh)',
  'young or mature; whole nuts',
  11,
  'coconut,fresh,tropical,nuts',
  30,
  'pantry',
  '{"min":2,"max":4,"metric":"Weeks","note":"Outer shell protects content in tropical storage"}'::jsonb,
  'regional',
  'Mindanao, Visayas',
  true
),

(
  10021,
  'Copra',
  'dried coconut meat; processed',
  14,
  'copra,dried coconut,agricultural',
  180,
  'pantry',
  '{"min":6,"max":12,"metric":"Months","note":"Shelf-stable dried coconut product"}'::jsonb,
  'regional',
  'Mindanao, Visayas',
  true
),

-- ============================================
-- CAR REGION (CORDILLERA) SPECIALTIES
-- ============================================

(
  10022,
  'Highland Vegetables',
  'fresh mix; cool climate grown',
  12,
  'vegetables,highland,cool,fresh,local',
  7,
  'refrigerated',
  '{"min":5,"max":10,"metric":"Days","note":"Cool climate vegetables last longer than lowland varieties"}'::jsonb,
  'regional',
  'Cordillera (CAR)',
  true
),

(
  10023,
  'Beans (String Beans)',
  'fresh; local variety',
  12,
  'beans,string beans,vegetables,local',
  5,
  'refrigerated',
  '{"min":3,"max":7,"metric":"Days","note":"Tropical variant has shorter shelf life"}'::jsonb,
  'regional',
  'CAR, Tagalog Regions',
  true
);

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Count new regional product types
SELECT 
  COUNT(*) as total_regional,
  COUNT(CASE WHEN source = 'usda' THEN 1 END) as total_usda,
  COUNT(CASE WHEN is_available_in_philippines THEN 1 END) as available_in_ph
FROM product_types;

-- List all regional types by region
SELECT region, COUNT(*) as count FROM product_types WHERE source = 'regional' GROUP BY region ORDER BY count DESC;

-- ============================================
-- COMPLETED: philippines_regional_products.sql
-- ============================================
