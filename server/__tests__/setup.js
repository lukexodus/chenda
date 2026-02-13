/**
 * Test Setup and Teardown
 * 
 * This file handles:
 * - Test database creation
 * - Database cleanup between tests
 * - Test environment configuration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

// Connection to postgres database (for creating test database)
const adminPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres' // Connect to default database
});

// Connection to test database
const testPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

/**
 * Create test database if it doesn't exist
 */
async function createTestDatabase() {
  try {
    // Check if test database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Creating test database: ${process.env.DB_NAME}`);
      try {
        await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`✅ Test database created`);
      } catch (createError) {
        // Try with template0 to avoid collation issues
        console.log(`⚠️  Retrying with template0...`);
        await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME} WITH TEMPLATE template0`);
        console.log(`✅ Test database created with template0`);
      }
    } else {
      console.log(`📦 Test database already exists: ${process.env.DB_NAME}`);
    }
  } catch (error) {
    console.error('❌ Error creating test database:', error.message);
    console.error('💡 Tip: Manually create the database with: createdb chenda_test');
    throw error;
  }
}

/**
 * Run migrations on test database
 */
async function runMigrations() {
  try {
    console.log('🔄 Running migrations on test database...');

    // Enable PostGIS extension first
    await testPool.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('✅ PostGIS extension enabled');

    // Drop all tables if they exist (clean slate for tests)
    await testPool.query(`
      DROP TABLE IF EXISTS analytics_events CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS product_types CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS session CASCADE;
      DROP TABLE IF EXISTS migrations CASCADE;
      DROP MATERIALIZED VIEW IF EXISTS products_search_cache CASCADE;
      DROP FUNCTION IF EXISTS calculate_distance_km CASCADE;
      DROP FUNCTION IF EXISTS calculate_shelf_life_percent CASCADE;
      DROP FUNCTION IF EXISTS calculate_expiration_date CASCADE;
      DROP FUNCTION IF EXISTS is_product_expired CASCADE;
      DROP FUNCTION IF EXISTS get_products_within_radius CASCADE;
      DROP FUNCTION IF EXISTS search_products CASCADE;
      DROP FUNCTION IF EXISTS refresh_products_search_cache CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);
    console.log('✅ Cleaned existing schema');

    // Read migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migration001 = fs.readFileSync(
      path.join(migrationsDir, '001_create_tables.sql'),
      'utf8'
    );
    const migration002 = fs.readFileSync(
      path.join(migrationsDir, '002_create_indexes.sql'),
      'utf8'
    );
    const migration003 = fs.readFileSync(
      path.join(migrationsDir, '003_create_session_table.sql'),
      'utf8'
    );

    // Run migrations
    await testPool.query(migration001);
    await testPool.query(migration002);
    await testPool.query(migration003);

    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  }
}

/**
 * Seed minimal test data
 */
async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');

    // Read seed files
    const seedsDir = path.join(__dirname, '../../seeds');
    const productTypesSql = fs.readFileSync(
      path.join(seedsDir, 'product_types.sql'),
      'utf8'
    );

    // Seed product types
    await testPool.query(productTypesSql);

    console.log('✅ Test data seeded');
  } catch (error) {
    console.error('❌ Error seeding test data:', error.message);
    throw error;
  }
}

/**
 * Clean all data from tables (except product_types)
 */
async function cleanDatabase() {
  try {
    // Delete in order to respect foreign keys
    await testPool.query('DELETE FROM orders');
    await testPool.query('DELETE FROM products');
    await testPool.query('DELETE FROM users');
    await testPool.query('DELETE FROM analytics_events');
    await testPool.query('DELETE FROM session');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
}

/**
 * Drop test database (for complete reset)
 */
async function dropTestDatabase() {
  try {
    // Terminate all connections to test database
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [process.env.DB_NAME]);

    // Drop database
    await adminPool.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Test database dropped: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Error dropping test database:', error.message);
    throw error;
  }
}

/**
 * Global setup - runs once before all tests
 */
async function globalSetup() {
  console.log('\n🧪 Setting up test environment...\n');
  
  try {
    await createTestDatabase();
    await runMigrations();
    await seedTestData();
    console.log('\n✅ Test environment ready\n');
  } catch (error) {
    console.error('\n❌ Test environment setup failed\n');
    throw error;
  }
}

/**
 * Global teardown - runs once after all tests
 */
async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');
  
  try {
    await testPool.end();
    await adminPool.end();
    console.log('✅ Test environment cleaned up\n');
  } catch (error) {
    console.error('❌ Error cleaning up test environment:', error.message);
  }
}

module.exports = {
  globalSetup,
  globalTeardown,
  cleanDatabase,
  dropTestDatabase,
  testPool
};
