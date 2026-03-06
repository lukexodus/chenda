#!/usr/bin/env node

/**
 * E2E Test Data Cleanup Script
 * 
 * Cleans test data without dropping the database (keeps schema and product types)
 * 
 * Usage: node e2e/scripts/clean-data.js
 */

import { cleanTestData } from '../setup/database.js';

console.log('==================================================');
console.log('   Chenda E2E Test Data Cleanup');
console.log('==================================================\n');

try {
  await cleanTestData();
  console.log('✅ Test data cleaned successfully\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Failed to clean test data:', error.message);
  process.exit(1);
}
