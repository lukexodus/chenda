#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

// Load environment variables from .env file
require('dotenv').config();

const path = require('path');
const { Client } = require('pg');
const fs = require('fs').promises;

// Database connection configuration
const dbPassword = process.env.DB_PASSWORD;
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chenda_db',
  user: process.env.DB_USER || 'postgres'
};

// Only include password if it's set
if (dbPassword && dbPassword !== '') {
  DB_CONFIG.password = dbPassword;
}

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

async function createMigrationsTable(client) {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await client.query(query);
  log('✓ Migrations tracking table ready', 'green');
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    'SELECT filename FROM migrations ORDER BY id'
  );
  return result.rows.map(row => row.filename);
}

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname);
  const files = await fs.readdir(migrationsDir);
  
  return files
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ensures migrations run in order: 001, 002, etc.
}

async function runMigration(client, filename) {
  const filePath = path.join(__dirname, filename);
  const sql = await fs.readFile(filePath, 'utf-8');
  
  log(`\n→ Running migration: ${filename}`, 'cyan');
  
  try {
    // Run the migration in a transaction
    await client.query('BEGIN');
    await client.query(sql);
    
    // Record that this migration has been applied
    await client.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    
    await client.query('COMMIT');
    log(`✓ Successfully applied: ${filename}`, 'green');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`✗ Failed to apply: ${filename}`, 'red');
    throw error;
  }
}

async function rollbackMigration(client, filename) {
  const filePath = path.join(__dirname, filename.replace('.sql', '_down.sql'));
  
  try {
    const sql = await fs.readFile(filePath, 'utf-8');
    
    log(`\n→ Rolling back migration: ${filename}`, 'yellow');
    
    await client.query('BEGIN');
    await client.query(sql);
    
    // Remove migration record
    await client.query(
      'DELETE FROM migrations WHERE filename = $1',
      [filename]
    );
    
    await client.query('COMMIT');
    log(`✓ Successfully rolled back: ${filename}`, 'green');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`✗ Rollback file not found or failed: ${filename}`, 'red');
    throw error;
  }
}

async function migrate(command = 'up') {
  const client = new Client(DB_CONFIG);
  
  try {
    log('\n🔗 Connecting to database...', 'blue');
    await client.connect();
    log(`✓ Connected to ${DB_CONFIG.database}@${DB_CONFIG.host}`, 'green');
    
    // Create migrations tracking table
    await createMigrationsTable(client);
    
    const appliedMigrations = await getAppliedMigrations(client);
    const migrationFiles = await getMigrationFiles();
    
    log(`\n📊 Status:`, 'blue');
    log(`   Applied migrations: ${appliedMigrations.length}`);
    log(`   Available migrations: ${migrationFiles.length}`);
    
    if (command === 'up') {
      // Run pending migrations
      const pendingMigrations = migrationFiles.filter(
        f => !appliedMigrations.includes(f)
      );
      
      if (pendingMigrations.length === 0) {
        log('\n✓ No pending migrations', 'green');
        return;
      }
      
      log(`\n🚀 Running ${pendingMigrations.length} pending migration(s)...`, 'blue');
      
      for (const migration of pendingMigrations) {
        await runMigration(client, migration);
      }
      
      log('\n✅ All migrations completed successfully!', 'green');
      
    } else if (command === 'rollback') {
      // Rollback last migration
      if (appliedMigrations.length === 0) {
        log('\n⚠ No migrations to rollback', 'yellow');
        return;
      }
      
      const lastMigration = appliedMigrations[appliedMigrations.length - 1];
      await rollbackMigration(client, lastMigration);
      
      log('\n✅ Rollback completed successfully!', 'green');
      
    } else if (command === 'status') {
      // Show migration status
      log('\n📋 Migration Status:', 'blue');
      
      for (const file of migrationFiles) {
        const isApplied = appliedMigrations.includes(file);
        const status = isApplied ? '✓' : '○';
        const color = isApplied ? 'green' : 'yellow';
        log(`   ${status} ${file}`, color);
      }
    }
    
  } catch (error) {
    log('\n❌ Migration error:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    log('\n🔌 Database connection closed\n', 'blue');
  }
}

// Command line interface
const command = process.argv[2] || 'up';

const validCommands = ['up', 'rollback', 'status'];
if (!validCommands.includes(command)) {
  log('\n❌ Invalid command', 'red');
  log('\nUsage:', 'blue');
  log('  node migrate.js up         - Run all pending migrations');
  log('  node migrate.js rollback   - Rollback the last migration');
  log('  node migrate.js status     - Show migration status');
  log('');
  process.exit(1);
}

// Run migrations
migrate(command);
