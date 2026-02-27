#!/usr/bin/env node

/**
 * Database Seeder
 * Executes SQL seed files to populate database with initial data
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

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
  const result = await client.query(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'migrations'"
  );
  
  if (result.rows[0].count === '0') {
    log('\n❌ Error: Migrations table not found', 'red');
    log('Please run migrations first: node migrations/migrate.js up', 'yellow');
    return false;
  }
  
  const migrationResult = await client.query('SELECT COUNT(*) as count FROM migrations');
  if (parseInt(migrationResult.rows[0].count) < 2) {
    log('\n❌ Error: Migrations not applied', 'red');
    log('Please run migrations first: node migrations/migrate.js up', 'yellow');
    return false;
  }
  
  return true;
}

async function getSeedFiles() {
  const seedsDir = __dirname;
  const files = await fs.readdir(seedsDir);
  
  // Return seed files in specific order
  const order = ['product_types.sql', 'mock_users.sql', 'mock_products.sql'];
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

async function checkExistingData(client) {
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

async function seed(force = false) {
  const client = new Client(DB_CONFIG);
  
  try {
    log('\n🌱 Starting Database Seeding\n', 'blue');
    log('━'.repeat(50), 'cyan');
    
    log('\n🔗 Connecting to database...', 'blue');
    await client.connect();
    log(`✓ Connected to ${DB_CONFIG.database}@${DB_CONFIG.host}`, 'green');
    
    // Check migrations
    const migrationsOk = await checkMigrations(client);
    if (!migrationsOk) {
      process.exit(1);
    }
    
    // Check existing data
    const existingData = await checkExistingData(client);
    
    log('\n📊 Current database state:', 'blue');
    log(`   Product Types: ${existingData.product_types}`);
    log(`   Users: ${existingData.users}`);
    log(`   Products: ${existingData.products}`);
    
    const hasData = Object.values(existingData).some(count => count > 0);
    
    if (hasData && !force) {
      log('\n⚠️  Warning: Database already contains data!', 'yellow');
      log('Use --force to clear and re-seed', 'yellow');
      log('\nCurrent data will be preserved.', 'cyan');
      process.exit(0);
    }
    
    if (force && hasData) {
      log('\n🗑️  Clearing existing data...', 'yellow');
      
      // Clear in reverse order due to foreign keys
      await client.query('TRUNCATE products CASCADE');
      await client.query('TRUNCATE users CASCADE');
      await client.query('TRUNCATE product_types CASCADE');
      
      log('✓ Cleared existing data', 'green');
    }
    
    // Run seed files
    const seedFiles = await getSeedFiles();
    
    log(`\n🚀 Seeding database with ${seedFiles.length} files...`, 'blue');
    
    for (const seedFile of seedFiles) {
      await runSeedFile(client, seedFile);
    }
    
    // Final verification
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
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

if (args.includes('--help') || args.includes('-h')) {
  log('\n🌱 Database Seeder', 'blue');
  log('\nUsage:', 'cyan');
  log('  node seed.js           - Seed database (fails if data exists)');
  log('  node seed.js --force   - Clear and re-seed database');
  log('  node seed.js --help    - Show this help message');
  log('');
  process.exit(0);
}

// Run seeder
seed(force);
