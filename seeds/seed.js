#!/usr/bin/env node

/**
 * Database Seeder
 * Executes SQL seed files to populate database with initial data
 *
 * Quick usage:
 *   node seeds/seed.js                 # Seed only when DB is empty
 *   node seeds/seed.js --force         # Clear and reseed all seedable data
 *   node seeds/seed.js --products-only # Reseed products only (keeps users/types)
 *   node seeds/seed.js --help          # Show CLI help
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Database connection configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chenda',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkMigrations(client) {
  // Ensure the migration tracking table exists before any seed operations.
  const result = await client.query(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'migrations'"
  );
  
  if (result.rows[0].count === '0') {
    log('\n❌ Error: Migrations table not found', 'red');
    log('Please run migrations first: node migrations/migrate.js up', 'yellow');
    return false;
  }
  
  // Require baseline migrations so seeded tables/columns are guaranteed to exist.
  const migrationResult = await client.query('SELECT COUNT(*) as count FROM migrations');
  if (parseInt(migrationResult.rows[0].count) < 2) {
    log('\n❌ Error: Migrations not applied', 'red');
    log('Please run migrations first: node migrations/migrate.js up', 'yellow');
    return false;
  }
  
  return true;
}

async function getSeedFiles(productsOnly = false) {
  const seedsDir = __dirname;
  const files = await fs.readdir(seedsDir);
  
  // Order matters because later files depend on data from earlier files.
  const order = productsOnly
    ? ['mock_products.sql', 'nationwide_products.sql']
    : [
        'product_types.sql',
        'philippines_regional_products.sql',
        'mock_users.sql',
        'mock_products.sql',
        'nationwide_products.sql'
      ];
  return order.filter(f => files.includes(f));
}

async function runSeedFile(client, filename) {
  const filePath = path.join(__dirname, filename);
  const sql = await fs.readFile(filePath, 'utf-8');
  
  log(`\n→ Running seed file: ${filename}`, 'cyan');
  
  try {
    await client.query(sql);
    log(`✓ Successfully seeded: ${filename}`, 'green');
  } catch (error) {
    log(`✗ Failed to seed: ${filename}`, 'red');
    throw error;
  }
}

/**
 * Read the product-images-manifest.json produced by fetch-product-images.js
 * and bulk-UPDATE product_types.image_url for every entry with a resolved image.
 * Then propagate the type image to any seeded products that have no image of their own.
 */
async function applyImageManifest(client) {
  const manifestPath = path.join(__dirname, 'product-images-manifest.json');

  try {
    await fs.access(manifestPath);
  } catch {
    log('\n⚠️  No product-images-manifest.json found — skipping image population.', 'yellow');
    log('   Run: node seeds/fetch-product-images.js --download --all', 'yellow');
    return;
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  const entries  = (manifest.products || []).filter(p => p.image);

  if (entries.length === 0) {
    log('\n⚠️  Manifest has no resolved images — skipping image population.', 'yellow');
    return;
  }

  log(`\n→ Applying image manifest (${entries.length} entries)...`, 'cyan');

  let matched = 0;
  for (const { name, image } of entries) {
    const result = await client.query(
      `UPDATE product_types SET image_url = $1
       WHERE LOWER(name) = LOWER($2) AND (image_url IS NULL OR image_url = '')`,
      [image, name]
    );
    if (result.rowCount > 0) matched++;
  }

  log(`✓ Updated ${matched} / ${entries.length} product type images`, 'green');

  // Propagate type image to seeded products that have no seller-uploaded photo
  const propagated = await client.query(
    `UPDATE products p
     SET image_url = pt.image_url
     FROM product_types pt
     WHERE pt.id = p.product_type_id
       AND (p.image_url IS NULL OR p.image_url = '')
       AND pt.image_url IS NOT NULL`
  );
  log(`✓ Propagated images to ${propagated.rowCount} products`, 'green');
}

async function checkExistingData(client) {
  // A lightweight safety check to avoid accidental duplicate inserts.
  const checks = [
    { table: 'product_types', name: 'Product Types' },
    { table: 'users', name: 'Users' },
    { table: 'products', name: 'Products' }
  ];
  
  const counts = {};
  for (const check of checks) {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${check.table}`);
    counts[check.table] = parseInt(result.rows[0].count);
  }
  
  return counts;
}

async function seed(force = false, productsOnly = false) {
  const client = new Client(DB_CONFIG);
  
  try {
    log(productsOnly ? '\n🌱 Seeding Products Only\n' : '\n🌱 Starting Database Seeding\n', 'blue');
    log('━'.repeat(50), 'cyan');
    
    log('\n🔗 Connecting to database...', 'blue');
    await client.connect();
    log(`✓ Connected to ${DB_CONFIG.database}@${DB_CONFIG.host}`, 'green');
    
    // Stop early if schema migrations have not been applied.
    const migrationsOk = await checkMigrations(client);
    if (!migrationsOk) {
      process.exit(1);
    }
    
    // Snapshot current table counts to decide safe seed strategy.
    const existingData = await checkExistingData(client);
    
    log('\n📊 Current database state:', 'blue');
    log(`   Product Types: ${existingData.product_types}`);
    log(`   Users: ${existingData.users}`);
    log(`   Products: ${existingData.products}`);
    
    const hasData = Object.values(existingData).some(count => count > 0);

    if (productsOnly) {
      // Delete & reseed only products — users/product_types must already exist
      if (existingData.users === 0 || existingData.product_types === 0) {
        log('\n❌ --products-only requires users and product_types to already exist.', 'red');
        log('Run a full seed first: node seed.js --force', 'yellow');
        process.exit(1);
      }
      log('\n🗑️  Clearing products (and orders)...', 'yellow');
      await client.query('DELETE FROM orders');
      await client.query('DELETE FROM products');
      await client.query("SELECT setval('products_id_seq', 1, false)");
      log('✓ Products cleared', 'green');
      log('➕ Reseeding products...', 'cyan');
    } else if (hasData && !force) {
      log('\n⚠️  Warning: Database already contains data!', 'yellow');
      log('Use --force to clear and re-seed', 'yellow');
      log('\nCurrent data will be preserved.', 'cyan');
      process.exit(0);
    } else if (force && hasData) {
      log('\n🗑️  Clearing existing data...', 'yellow');
      
      // Clear in reverse dependency order to satisfy foreign key constraints.
      await client.query('TRUNCATE products CASCADE');
      await client.query('TRUNCATE users CASCADE');
      await client.query('TRUNCATE product_types CASCADE');
      
      log('✓ Cleared existing data', 'green');
    }
    
    // Execute each SQL seed file sequentially for deterministic results.
    const seedFiles = await getSeedFiles(productsOnly);
    
    log(`\n🚀 Seeding database with ${seedFiles.length} files...`, 'blue');
    
    for (const seedFile of seedFiles) {
      await runSeedFile(client, seedFile);
    }

    // Populate product_types.image_url from the downloaded manifest,
    // then cascade those images to products.
    await applyImageManifest(client);

    const finalData = await checkExistingData(client);
    
    log('\n━'.repeat(50), 'cyan');
    log('\n✅ Database seeded successfully!', 'green');
    
    log('\n📊 Final database state:', 'blue');
    log(`   Product Types: ${finalData.product_types}`, 'green');
    log(`   Users: ${finalData.users}`, 'green');
    log(`   Products: ${finalData.products}`, 'green');
    
    log('\n💡 Test credentials:', 'cyan');
    log('   Email: maria.santos@email.com');
    log('   Password: password123');
    log('   (All mock users have the same password)\n');
    
  } catch (error) {
    log('\n❌ Seeding error:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    log('🔌 Database connection closed\n', 'blue');
  }
}

// Command line interface
// Usage examples:
//   node seeds/seed.js
//   node seeds/seed.js --force
//   node seeds/seed.js --products-only
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');
const productsOnly = args.includes('--products-only') || args.includes('-p');

if (args.includes('--help') || args.includes('-h')) {
  log('\n🌱 Database Seeder', 'blue');
  log('\nUsage:', 'cyan');
  log('  node seed.js                  - Seed database (fails if data exists)');
  log('  node seed.js --force          - Clear everything and re-seed');
  log('  node seed.js --products-only  - Delete & reseed only products (keeps users)');
  log('  node seed.js --help           - Show this help message');
  log('');
  process.exit(0);
}

// Run seeder
seed(force, productsOnly);
