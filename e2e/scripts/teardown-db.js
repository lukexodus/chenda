#!/usr/bin/env node

/**
 * E2E Test Database Teardown Script
 * 
 * Run this after E2E tests to clean up the test database
 * 
 * Usage: node e2e/scripts/teardown-db.js
 */

import { teardownTestDatabase } from '../setup/database.js';

console.log('==================================================');
console.log('   Chenda E2E Test Database Teardown');
console.log('==================================================\n');

try {
  await teardownTestDatabase();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Failed to teardown test database:', error.message);
  process.exit(1);
}
