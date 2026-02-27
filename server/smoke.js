/**
 * Quick smoke test: send a single request to the API and log the full error.
 */
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'chenda_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.SESSION_SECRET = 'test-secret';

const http = require('http');

(async () => {
    try {
        const app = require('./app');
        const server = app.listen(0);
        const port = server.address().port;

        const options = {
            hostname: 'localhost',
            port,
            path: '/api/health',
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                console.log('Headers:', JSON.stringify(res.headers, null, 2));
                console.log('Body:', data);
                server.close();
                process.exit(0);
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e.message);
            server.close();
            process.exit(1);
        });

        req.end();
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
