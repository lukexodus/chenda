const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL connection pool configuration
 * Uses environment variables from .env file
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chenda',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
});

/**
 * Event handlers for pool
 */
pool.on('connect', () => {
  console.log('✓ New client connected to the database pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

/**
 * Helper function to test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW(), version() as pg_version');
    console.log('✓ Database connection successful');
    console.log(`  Time: ${result.rows[0].now}`);
    console.log(`  PostgreSQL: ${result.rows[0].pg_version.split(',')[0]}`);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  } finally {
    client.release();
  }
};

/**
 * Helper function to execute a query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

/**
 * Helper function to get a client from the pool
 * Use this for transactions
 * @returns {Promise} Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);
  
  // Set a timeout of 5 seconds for the client
  const timeout = setTimeout(() => {
    console.error('❌ A client has been checked out for more than 5 seconds!');
    console.error('The last query executed was:', client.lastQuery);
  }, 5000);
  
  // Monkey patch the query method to track queries
  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };
  
  // Monkey patch the release method to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };
  
  return client;
};

/**
 * Graceful shutdown - close pool
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('✓ Database pool has been closed');
  } catch (err) {
    console.error('❌ Error closing database pool:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};
