/**
 * E2E Test Database Configuration
 * 
 * Uses a separate test database (chenda_e2e_test) to avoid interfering with development data
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../server/.env') });

// Test database configuration
export const TEST_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: 'chenda_e2e_test', // Separate test database
};

// Main database config (for creating test database)
export const MAIN_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: 'postgres', // Connect to postgres to create/drop databases
};

/**
 * Create test database if it doesn't exist
 */
export async function createTestDatabase() {
  const client = new Client(MAIN_DB_CONFIG);
  
  try {
    await client.connect();
    
    // Check if test database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ['chenda_e2e_test']
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Creating test database: chenda_e2e_test');
      
      // Create database with explicit template and encoding
      try {
        await client.query("CREATE DATABASE chenda_e2e_test WITH ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0");
      } catch (createError) {
        // If that fails, try simple create
        console.log('Trying alternative database creation method...');
        await client.query('CREATE DATABASE chenda_e2e_test');
      }
      
      // Enable PostGIS extension
      const testClient = new Client(TEST_DB_CONFIG);
      await testClient.connect();
      await testClient.query('CREATE EXTENSION IF NOT EXISTS postgis');
      await testClient.end();
      
      console.log('✅ Test database created with PostGIS extension');
    } else {
      console.log('✅ Test database already exists');
    }
  } catch (error) {
    console.error('❌ Error creating test database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Drop test database (cleanup)
 */
export async function dropTestDatabase() {
  const client = new Client(MAIN_DB_CONFIG);
  
  try {
    await client.connect();
    
    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'chenda_e2e_test' AND pid <> pg_backend_pid()
    `);
    
    await client.query('DROP DATABASE IF EXISTS chenda_e2e_test');
    console.log('✅ Test database dropped');
  } catch (error) {
    console.error('❌ Error dropping test database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Run migrations on test database
 */
export async function runTestMigrations() {
  const client = new Client(TEST_DB_CONFIG);
  
  try {
    await client.connect();
    console.log('Running migrations on test database...');
    
    // Read and execute migration files
    const migrationsDir = resolve(__dirname, '../../migrations');
    
    // Run 001_create_tables.sql
    const createTablesSQL = fs.readFileSync(
      resolve(migrationsDir, '001_create_tables.sql'),
      'utf8'
    );
    await client.query(createTablesSQL);
    console.log('✅ Tables created');
    
    // Run 002_create_indexes.sql
    const createIndexesSQL = fs.readFileSync(
      resolve(migrationsDir, '002_create_indexes.sql'),
      'utf8'
    );
    await client.query(createIndexesSQL);
    console.log('✅ Indexes created');
    
    // Run 003_create_session_table.sql
    const createSessionSQL = fs.readFileSync(
      resolve(migrationsDir, '003_create_session_table.sql'),
      'utf8'
    );
    await client.query(createSessionSQL);
    console.log('✅ Session table created');
    
    console.log('✅ All migrations completed');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Seed test database with minimal data
 */
export async function seedTestDatabase() {
  const client = new Client(TEST_DB_CONFIG);
  
  try {
    await client.connect();
    console.log('Seeding test database...');
    
    // Seed product types (essential for product creation)
    const seedsDir = resolve(__dirname, '../../seeds');
    const productTypesSQL = fs.readFileSync(
      resolve(seedsDir, 'product_types.sql'),
      'utf8'
    );
    await client.query(productTypesSQL);
    console.log('✅ Product types seeded (180 USDA items)');
    
    console.log('✅ Test database seeded');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Clean test data (keep schema, remove user-generated data)
 */
export async function cleanTestData() {
  const client = new Client(TEST_DB_CONFIG);
  
  try {
    await client.connect();
    
    // Disable triggers temporarily
    await client.query('SET session_replication_role = replica');
    
    // Clean data in reverse order of dependencies
    await client.query('TRUNCATE TABLE analytics_events CASCADE');
    await client.query('TRUNCATE TABLE orders CASCADE');
    await client.query('TRUNCATE TABLE products CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');
    await client.query('TRUNCATE TABLE session CASCADE');
    
    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');
    
    // Reset sequences
    await client.query("SELECT setval('users_id_seq', 1, false)");
    await client.query("SELECT setval('products_id_seq', 1, false)");
    await client.query("SELECT setval('orders_id_seq', 1, false)");
    
    console.log('✅ Test data cleaned');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Complete test database setup (create + migrate + seed)
 */
export async function setupTestDatabase() {
  console.log('\n🔧 Setting up E2E test database...\n');
  
  await createTestDatabase();
  await runTestMigrations();
  await seedTestDatabase();
  
  console.log('\n✅ Test database ready for E2E testing!\n');
}

/**
 * Complete test database teardown
 */
export async function teardownTestDatabase() {
  console.log('\n🧹 Tearing down E2E test database...\n');
  await dropTestDatabase();
  console.log('\n✅ Test database removed\n');
}
