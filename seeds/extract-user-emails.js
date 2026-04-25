#!/usr/bin/env node

/**
 * extract-user-emails.js
 * Print user emails from the database, optionally grouped by role.
 *
 * Usage:
 *   node seeds/extract-user-emails.js
 *   node seeds/extract-user-emails.js --flat
 *   node seeds/extract-user-emails.js --json
 *   node seeds/extract-user-emails.js --help
 */

import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chenda',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

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

function printHelp() {
  log('\nExtract user emails from the users table\n', 'blue');
  console.log('Usage:');
  console.log('  node seeds/extract-user-emails.js          # grouped by role (default)');
  console.log('  node seeds/extract-user-emails.js --flat   # one email per line');
  console.log('  node seeds/extract-user-emails.js --json   # JSON output');
  console.log('  node seeds/extract-user-emails.js --help   # show help\n');
}

function groupByRole(rows) {
  return rows.reduce((acc, row) => {
    const role = row.type || 'unknown';
    if (!acc[role]) acc[role] = [];
    acc[role].push(row.email);
    return acc;
  }, {});
}

function printGrouped(grouped) {
  const roles = Object.keys(grouped).sort();
  let total = 0;

  for (const role of roles) {
    const emails = grouped[role].slice().sort((a, b) => a.localeCompare(b));
    total += emails.length;
    log(`\n${role} (${emails.length})`, 'cyan');
    for (const email of emails) {
      console.log(`- ${email}`);
    }
  }

  log(`\nTotal emails: ${total}\n`, 'green');
}

function printFlat(rows) {
  const emails = rows.map(row => row.email).sort((a, b) => a.localeCompare(b));
  for (const email of emails) {
    console.log(email);
  }
}

async function main() {
  if (process.argv.includes('--help')) {
    printHelp();
    return;
  }

  const asJson = process.argv.includes('--json');
  const flat = process.argv.includes('--flat');

  const client = new Client(DB_CONFIG);

  try {
    await client.connect();

    const result = await client.query(`
      SELECT type, email
      FROM users
      WHERE email IS NOT NULL AND email <> ''
      ORDER BY type, email
    `);

    const rows = result.rows;

    if (asJson) {
      const grouped = groupByRole(rows);
      console.log(JSON.stringify(grouped, null, 2));
      return;
    }

    if (flat) {
      printFlat(rows);
      return;
    }

    const grouped = groupByRole(rows);
    printGrouped(grouped);
  } catch (error) {
    log(`\nFailed to extract user emails: ${error.message}\n`, 'red');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
