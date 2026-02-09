# Chenda API Server

Express.js API server for the Chenda perishable goods e-commerce platform.

## 📋 Requirements

- Node.js 18+ or 20+
- PostgreSQL 18+ with PostGIS extension
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

**Required environment variables:**
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: chenda)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password
- `SESSION_SECRET` - Session secret key (change in production!)

### 3. Start the Server

**Development:**
```bash
npm start
```

**With auto-reload (requires nodemon):**
```bash
npm install -g nodemon
npm run dev
```

Server will start on `http://localhost:3001`

## 📁 Project Structure

```
server/
├── config/
│   ├── database.js       # PostgreSQL connection pool
│   └── index.js          # Centralized configuration
├── routes/
│   └── health.js         # Health check endpoint
├── controllers/          # Business logic (to be added)
├── models/               # Database models (to be added)
├── middleware/
│   ├── errorHandler.js   # Error handling
│   └── logger.js         # Request logging
├── app.js                # Main application
├── package.json          # Dependencies & scripts
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment file
└── .gitignore            # Git ignore rules
```

## 🔌 API Endpoints

### Root
```
GET /
```
Returns API information and available endpoints.

### Health Check
```
GET /api/health
```
Returns server and database status.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-09T03:07:43.267Z",
  "server": {
    "environment": "development",
    "uptime": 16.93,
    "port": "3001"
  },
  "database": {
    "connected": true,
    "time": "2026-02-09T03:07:43.266Z",
    "version": "PostgreSQL 18.1"
  }
}
```

## 🔧 Configuration

All configuration is centralized in `config/index.js`:

- **Server**: Port, environment mode
- **Database**: Connection settings
- **Session**: Secret, max age, cookie settings
- **CORS**: Allowed origins
- **Rate Limiting**: Window, max requests
- **Pagination**: Default limits
- **File Upload**: Max size, allowed types

## 🗄️ Database

### Connection Pool

The server uses node-postgres (`pg`) with connection pooling:

- **Max Clients**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds

### Helper Functions

```javascript
const { query, getClient } = require('./config/database');

// Simple query
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users...');
  await client.query('INSERT INTO orders...');
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

## 🔒 Security

The server implements multiple security layers:

- **Helmet**: Security headers (XSS, clickjacking protection)
- **CORS**: Cross-origin request control
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Session**: HTTP-only cookies, secure in production
- **Input Validation**: express-validator (to be used in routes)

## 🧪 Testing

Test the server with cURL:

```bash
# Health check
curl http://localhost:3001/api/health

# Root endpoint
curl http://localhost:3001/

# Test 404 handler
curl http://localhost:3001/api/nonexistent
```

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 3001 | Server port |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | chenda | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | - | Database password |
| `SESSION_SECRET` | - | Session secret key |
| `SESSION_MAX_AGE` | 86400000 | Session duration (24h) |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## 🐛 Troubleshooting

### Database Connection Failed

**Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

**Test connection manually:**
```bash
psql -h localhost -U postgres -d chenda
```

**Verify environment variables in `.env`**

### Port Already in Use

**Kill existing process:**
```bash
pkill -f "node app.js"
```

**Or change port in `.env`:**
```env
PORT=3002
```

### Module Not Found

**Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| pg | PostgreSQL client |
| bcrypt | Password hashing |
| passport | Authentication |
| express-session | Session management |
| dotenv | Environment variables |
| cors | CORS handling |
| helmet | Security headers |
| express-rate-limit | Rate limiting |
| express-validator | Input validation |
| morgan | HTTP logging |

## 🚧 Development

### Adding New Routes

1. Create route file in `routes/`:
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/', asyncHandler(async (req, res) => {
  // Your code here
  res.json({ success: true, data: [] });
}));

module.exports = router;
```

2. Register route in `app.js`:
```javascript
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
```

### Adding Controllers

Create controller files in `controllers/`:
```javascript
// controllers/userController.js
const { query } = require('../config/database');

exports.getAllUsers = async (req, res) => {
  const result = await query('SELECT * FROM users');
  res.json({ success: true, data: result.rows });
};
```

### Adding Models

Create model files in `models/`:
```javascript
// models/User.js
const { query } = require('../config/database');

class User {
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = User;
```

## 📖 API Documentation

Full API documentation will be available once all endpoints are implemented.

Current status: **Task 1.2 Complete** - Server foundation ready

Next steps:
- Task 1.3: Authentication endpoints
- Task 1.4: Algorithm integration
- Task 1.5: Product management
- Task 1.6: User management

## 📄 License

ISC

## 👥 Team

Chenda Development Team
