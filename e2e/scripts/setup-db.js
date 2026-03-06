#!/usr/bin/env node

/**
 * E2E Test Database Setup Script
 * 
 * Run this before E2E tests to prepare the test database
 * 
 * Usage: node e2e/scripts/setup-db.js
 */

import { setupTestDatabase } from '../setup/database.js';

console.log('==================================================');
console.log('   Chenda E2E Test Database Setup');
console.log('==================================================\n');

try {
  await setupTestDatabase();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Failed to setup test database:', error.message);
  process.exit(1);
}
