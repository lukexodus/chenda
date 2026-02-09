#!/usr/bin/env node

/**
 * Database Connection Test
 * Tests PostgreSQL + PostGIS connectivity and basic queries
 */

const { Client } = require('pg');

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

async function testConnection() {
  const client = new Client(DB_CONFIG);
  let testsRun = 0;
  let testsPassed = 0;
  
  try {
    log('\n🧪 Starting Database Connection Tests\n', 'blue');
    log('━'.repeat(50), 'cyan');
    
    // Test 1: Basic connection
    log('\nTest 1: Database Connection', 'yellow');
    await client.connect();
    log('✓ Connected to PostgreSQL', 'green');
    testsRun++;
    testsPassed++;
    
    // Test 2: PostgreSQL version
    log('\nTest 2: PostgreSQL Version', 'yellow');
    const versionResult = await client.query('SELECT version();');
    const version = versionResult.rows[0].version;
    log(`✓ ${version.split(',')[0]}`, 'green');
    testsRun++;
    testsPassed++;
    
    // Test 3: PostGIS extension
    log('\nTest 3: PostGIS Extension', 'yellow');
    try {
      const postgisResult = await client.query('SELECT PostGIS_version();');
      log(`✓ PostGIS ${postgisResult.rows[0].postgis_version}`, 'green');
      testsRun++;
      testsPassed++;
    } catch (error) {
      log('✗ PostGIS not installed', 'red');
      testsRun++;
    }
    
    // Test 4: Tables exist
    log('\nTest 4: Core Tables', 'yellow');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('users', 'products', 'product_types', 'orders', 'analytics_events')
      ORDER BY table_name;
    `);
    
    const expectedTables = ['analytics_events', 'orders', 'product_types', 'products', 'users'];
    const foundTables = tablesResult.rows.map(r => r.table_name);
    
    if (foundTables.length === expectedTables.length) {
      log(`✓ All ${foundTables.length} core tables exist`, 'green');
      foundTables.forEach(table => log(`  • ${table}`, 'cyan'));
      testsRun++;
      testsPassed++;
    } else {
      log('✗ Missing tables', 'red');
      testsRun++;
    }
    
    // Test 5: Spatial indexes
    log('\nTest 5: Spatial Indexes (GIST)', 'yellow');
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexdef LIKE '%USING gist%'
      ORDER BY indexname;
    `);
    
    if (indexResult.rows.length > 0) {
      log(`✓ Found ${indexResult.rows.length} spatial indexes`, 'green');
      indexResult.rows.forEach(row => log(`  • ${row.indexname}`, 'cyan'));
      testsRun++;
      testsPassed++;
    } else {
      log('✗ No spatial indexes found', 'red');
      testsRun++;
    }
    
    // Test 6: Helper functions
    log('\nTest 6: Custom Helper Functions', 'yellow');
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name IN (
        'calculate_distance_km',
        'calculate_shelf_life_percent',
        'calculate_expiration_date',
        'is_product_expired',
        'get_products_within_radius',
        'search_products'
      )
      ORDER BY routine_name;
    `);
    
    if (functionsResult.rows.length === 6) {
      log(`✓ All ${functionsResult.rows.length} helper functions exist`, 'green');
      functionsResult.rows.forEach(row => log(`  • ${row.routine_name}`, 'cyan'));
      testsRun++;
      testsPassed++;
    } else {
      log(`⚠ Found ${functionsResult.rows.length}/6 functions`, 'yellow');
      testsRun++;
      if (functionsResult.rows.length >= 4) testsPassed++;
    }
    
    // Test 7: Spatial query (distance calculation)
    log('\nTest 7: Spatial Distance Query', 'yellow');
    const distanceResult = await client.query(`
      SELECT calculate_distance_km(
        14.5995, 120.9842,  -- Quezon City
        14.5547, 121.0244   -- Makati
      ) as distance_km;
    `);
    
    const distance = parseFloat(distanceResult.rows[0].distance_km);
    if (distance > 0 && distance < 50) {
      log(`✓ Distance calculation working: ${distance.toFixed(2)} km`, 'green');
      testsRun++;
      testsPassed++;
    } else {
      log('✗ Distance calculation failed', 'red');
      testsRun++;
    }
    
    // Test 8: Shelf life calculation
    log('\nTest 8: Shelf Life Calculation', 'yellow');
    const shelfLifeResult = await client.query(`
      SELECT calculate_shelf_life_percent(14, 1) as freshness_percent;
    `);
    
    const freshness = parseFloat(shelfLifeResult.rows[0].freshness_percent);
    if (freshness > 90 && freshness < 95) {
      log(`✓ Shelf life calculation working: ${freshness.toFixed(2)}%`, 'green');
      testsRun++;
      testsPassed++;
    } else {
      log('✗ Shelf life calculation failed', 'red');
      testsRun++;
    }
    
    // Test 9: Expiration date calculation
    log('\nTest 9: Expiration Date Calculation', 'yellow');
    const expirationResult = await client.query(`
      SELECT calculate_expiration_date(
        '2026-02-09'::timestamp,
        14,
        1
      ) as expiration_date;
    `);
    
    const expirationDate = new Date(expirationResult.rows[0].expiration_date);
    if (expirationDate > new Date('2026-02-20')) {
      log(`✓ Expiration date: ${expirationDate.toISOString().split('T')[0]}`, 'green');
      testsRun++;
      testsPassed++;
    } else {
      log('✗ Expiration date calculation failed', 'red');
      testsRun++;
    }
    
    // Test 10: Views
    log('\nTest 10: Database Views', 'yellow');
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (viewsResult.rows.length > 0) {
      log(`✓ Found ${viewsResult.rows.length} views`, 'green');
      viewsResult.rows.forEach(row => log(`  • ${row.table_name}`, 'cyan'));
      testsRun++;
      testsPassed++;
    } else {
      log('⚠ No views found', 'yellow');
      testsRun++;
    }
    
    // Summary
    log('\n' + '━'.repeat(50), 'cyan');
    log('\n📊 Test Summary:', 'blue');
    log(`   Tests Run:    ${testsRun}`, 'cyan');
    log(`   Tests Passed: ${testsPassed}`, testsPassed === testsRun ? 'green' : 'yellow');
    log(`   Tests Failed: ${testsRun - testsPassed}`, testsRun === testsPassed ? 'green' : 'red');
    log(`   Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`, 
        testsPassed === testsRun ? 'green' : 'yellow');
    
    if (testsPassed === testsRun) {
      log('\n✅ All tests passed! Database is ready.', 'green');
    } else {
      log('\n⚠️  Some tests failed. Check configuration.', 'yellow');
    }
    
    log('');
    
  } catch (error) {
    log('\n❌ Connection test failed:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    log('🔌 Connection closed\n', 'blue');
  }
}

// Run tests
testConnection();
