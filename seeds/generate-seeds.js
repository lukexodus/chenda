#!/usr/bin/env node

/**
 * Generate SQL seed files from JSON data
 * Converts mock data from algorithm to PostgreSQL-compatible SQL
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Paths
const ALGO_DIR = path.join(__dirname, '../chenda-algo/src');
const SEEDS_DIR = __dirname;

// Helper function to escape SQL strings
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Helper function to format JSON for JSONB
function formatJsonb(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

// Helper function to create PostGIS POINT
function formatPoint(lat, lng) {
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

// Generate product_types.sql
async function generateProductTypes() {
  console.log('📦 Generating product_types.sql...');
  
  const productTypes = JSON.parse(
    fs.readFileSync(path.join(ALGO_DIR, 'product-management/product-types.json'), 'utf-8')
  );
  
  let sql = `-- Seed Data: Product Types (USDA FoodKeeper Database)
-- Date: ${new Date().toISOString()}
-- Total items: ${productTypes.length}

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

`;

  // Group inserts for better performance
  sql += `INSERT INTO product_types (
  id,
  name,
  name_subtitle,
  category_id,
  keywords,
  default_shelf_life_days,
  default_storage_condition,
  shelf_life_source
) VALUES\n`;

  const values = productTypes.map((pt, index) => {
    const isLast = index === productTypes.length - 1;
    return `  (
    ${pt.id},
    ${escapeSql(pt.name)},
    ${escapeSql(pt.name_subtitle)},
    ${pt.category_id || 'NULL'},
    ${escapeSql(pt.keywords)},
    ${pt.default_shelf_life_days},
    ${escapeSql(pt.default_storage_condition)},
    ${formatJsonb(pt.shelf_life_source)}
  )${isLast ? ';' : ','}`;
  }).join('\n');

  sql += values;
  
  sql += `\n\n-- Re-enable triggers
SET session_replication_role = 'origin';

-- Note: product_types uses INTEGER PRIMARY KEY (no auto-sequence)
-- IDs are predefined from USDA database

-- Verify count
SELECT COUNT(*) as product_types_count FROM product_types;
`;

  fs.writeFileSync(path.join(SEEDS_DIR, 'product_types.sql'), sql);
  console.log(`✅ Generated ${productTypes.length} product types`);
}

// Generate mock_users.sql
async function generateMockUsers() {
  console.log('👥 Generating mock_users.sql...');
  
  const users = JSON.parse(
    fs.readFileSync(path.join(ALGO_DIR, 'data/mock_users.json'), 'utf-8')
  );
  
  let sql = `-- Seed Data: Mock Users
-- Date: ${new Date().toISOString()}
-- Total users: ${users.length}
-- Default password for all users: 'password123'

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

`;

  // Generate password hash (same for all mock users)
  const passwordHash = await bcrypt.hash('password123', 10);
  
  sql += `INSERT INTO users (
  name,
  email,
  password_hash,
  type,
  location,
  address,
  preferences,
  email_verified,
  created_at
) VALUES\n`;

  const values = users.map((user, index) => {
    const isLast = index === users.length - 1;
    return `  (
    ${escapeSql(user.name)},
    ${escapeSql(user.email)},
    ${escapeSql(passwordHash)},
    ${escapeSql(user.type)},
    ${formatPoint(user.location.lat, user.location.lng)},
    ${escapeSql(user.location.address)},
    ${formatJsonb(user.preferences)},
    true,
    ${escapeSql(user.created_at)}
  )${isLast ? ';' : ','}`;
  }).join('\n');

  sql += values;
  
  sql += `\n\n-- Re-enable triggers
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
`;

  fs.writeFileSync(path.join(SEEDS_DIR, 'mock_users.sql'), sql);
  console.log(`✅ Generated ${users.length} mock users`);
  console.log(`   Default password: 'password123'`);
}

// Generate mock_products.sql
async function generateMockProducts() {
  console.log('🛒 Generating mock_products.sql...');
  
  const products = JSON.parse(
    fs.readFileSync(path.join(ALGO_DIR, 'data/mock_products.json'), 'utf-8')
  );
  
  let sql = `-- Seed Data: Mock Products
-- Date: ${new Date().toISOString()}
-- Total products: ${products.length}
-- Note: Requires product_types and users to be seeded first

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

`;

  sql += `INSERT INTO products (
  seller_id,
  product_type_id,
  days_already_used,
  listed_date,
  price,
  quantity,
  unit,
  location,
  address,
  storage_condition,
  description,
  status
) VALUES\n`;

  const values = products.map((product, index) => {
    const isLast = index === products.length - 1;
    return `  (
    ${product.seller_id},
    ${product.product_type_id},
    ${product.days_already_used},
    ${escapeSql(product.listed_date)},
    ${product.price},
    ${product.quantity},
    ${escapeSql(product.unit)},
    ${formatPoint(product.location.lat, product.location.lng)},
    ${escapeSql(product.location.address)},
    ${escapeSql(product.storage_condition)},
    ${escapeSql(product.description)},
    ${escapeSql(product.status)}
  )${isLast ? ';' : ','}`;
  }).join('\n');

  sql += values;
  
  sql += `\n\n-- Re-enable triggers
SET session_replication_role = 'origin';

-- Update sequence
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Note: Materialized view will be refreshed on first query
-- Or manually refresh with: REFRESH MATERIALIZED VIEW products_search_cache;

-- Verify count
SELECT COUNT(*) as products_count FROM products;

-- Show products with enriched data
SELECT 
  p.id,
  pt.name as product_name,
  u.name as seller_name,
  p.price,
  p.quantity,
  p.unit,
  ST_X(p.location::geometry) as longitude,
  ST_Y(p.location::geometry) as latitude,
  p.address,
  p.storage_condition,
  p.days_already_used,
  pt.default_shelf_life_days,
  calculate_shelf_life_percent(pt.default_shelf_life_days, p.days_already_used) as freshness_percent,
  p.status
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
JOIN users u ON p.seller_id = u.id
ORDER BY p.id
LIMIT 10;
`;

  fs.writeFileSync(path.join(SEEDS_DIR, 'mock_products.sql'), sql);
  console.log(`✅ Generated ${products.length} mock products`);
}

// Main function
async function main() {
  console.log('\n🌱 Generating Seed Data Files\n');
  console.log('━'.repeat(50));
  
  try {
    await generateProductTypes();
    await generateMockUsers();
    await generateMockProducts();
    
    console.log('━'.repeat(50));
    console.log('\n✅ All seed files generated successfully!\n');
    console.log('📁 Files created:');
    console.log('   - seeds/product_types.sql');
    console.log('   - seeds/mock_users.sql');
    console.log('   - seeds/mock_products.sql');
    console.log('\n💡 To seed the database, run:');
    console.log('   node seeds/seed.js\n');
    
  } catch (error) {
    console.error('\n❌ Error generating seed files:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateProductTypes, generateMockUsers, generateMockProducts };
