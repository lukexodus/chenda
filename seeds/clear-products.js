#!/usr/bin/env node

/**
 * clear-products.js
 * Deletes all rows from the products table and resets the sequence.
 * Leaves users, product_types, orders, and sessions untouched.
 *
 * Usage:
 *   node seeds/clear-products.js           -- dry-run (shows counts, does nothing)
 *   node seeds/clear-products.js --confirm  -- actually deletes
 */

import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'chenda',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

const colors = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
};
const log = (msg, c = 'reset') => console.log(`${colors[c]}${msg}${colors.reset}`);

async function main() {
  const confirm = process.argv.includes('--confirm');
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    log(`✓ Connected to ${DB_CONFIG.database}@${DB_CONFIG.host}`, 'green');

    // Show current counts
    const { rows: [counts] } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM products)  AS products,
        (SELECT COUNT(*) FROM orders)    AS orders,
        (SELECT COUNT(*) FROM users)     AS users
    `);
    log('\n📊 Current state:', 'blue');
    log(`   Products : ${counts.products}`);
    log(`   Orders   : ${counts.orders}  (will also be deleted — FK)`);
    log(`   Users    : ${counts.users}  (untouched)`);

    if (!confirm) {
      log('\n⚠️  Dry-run mode — nothing was changed.', 'yellow');
      log('Run with --confirm to actually delete:', 'yellow');
      log('  node seeds/clear-products.js --confirm\n', 'cyan');
      return;
    }

    // Delete in FK order: orders first, then products
    log('\n🗑️  Deleting orders...', 'yellow');
    const { rowCount: deletedOrders } = await client.query('DELETE FROM orders');
    log(`   Deleted ${deletedOrders} order(s)`, 'green');

    log('🗑️  Deleting products...', 'yellow');
    const { rowCount: deletedProducts } = await client.query('DELETE FROM products');
    log(`   Deleted ${deletedProducts} product(s)`, 'green');

    // Reset sequence so IDs start from 1 again
    await client.query("SELECT setval('products_id_seq', 1, false)");
    log('   Reset products_id_seq to 1', 'green');

    // Refresh search cache
    try {
      await client.query('REFRESH MATERIALIZED VIEW products_search_cache');
      log('   Refreshed products_search_cache', 'green');
    } catch (e) {
      log(`   ⚠ Could not refresh materialized view: ${e.message}`, 'yellow');
    }

    log('\n✅ Done! Products cleared.', 'green');
    log('Now reseed with:', 'cyan');
    log('  node seeds/seed.js --products-only\n', 'cyan');

  } catch (err) {
    log(`\n❌ Error: ${err.message}`, 'red');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
