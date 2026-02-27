/**
 * Diagnostic: quickly test if app starts correctly 
 * and if basic security middleware is working.
 */
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'chenda_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.SESSION_SECRET = 'test-secret';

try {
    const app = require('./app');
    console.log('✅ App loaded OK');
} catch (err) {
    console.error('❌ App failed to load:', err.message);
    console.error(err.stack);
}
