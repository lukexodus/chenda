const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
require('dotenv').config();

// Import configuration
const config = require('./config');
const { testConnection, pool } = require('./config/database');
const passport = require('./config/passport');

// Import middleware
const getLogger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { responseTimeTracker, authAnalyticsMiddleware, preferenceAnalyticsMiddleware, errorAnalyticsMiddleware } = require('./middleware/analyticsMiddleware');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const productRoutes = require('./routes/products');
const productTypesRoutes = require('./routes/productTypes');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
// Import routes
const healthRoutes = require('./routes/health');

/**
 * Initialize Express application
 */
const app = express();

/**
 * Security & Performance Middleware
 */

// Helmet: Set security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
}));

// CORS: Enable cross-origin requests
app.use(cors(config.cors));

// Rate limiting: Prevent abuse (disabled in development)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.server.isDevelopment ? 0 : config.rateLimit.max, // 0 = unlimited in dev
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.server.isDevelopment,
});
app.use('/api/', limiter);

/**
 * Request Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Session Middleware (PostgreSQL Session Storage)
 */
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: false, // We created it with migration
    pruneSessionInterval: 60 * 60, // Prune every hour (in seconds)
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  name: config.session.name,
  cookie: {
    maxAge: config.session.maxAge,
    httpOnly: true,
    secure: config.session.secure,
    sameSite: 'lax',
  },
}));

/**
 * Passport Authentication Middleware
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Logging Middleware
 */
app.use(getLogger());

/**
 * Analytics Middleware (Response time tracking and utilities)
 */
app.use(responseTimeTracker);

/**
 * Static File Serving
 */
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Routes
 */

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chenda API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
    },
  });
});

// Health check
app.use('/api/health', healthRoutes);

// Authentication routes (with analytics middleware)
app.use('/api/auth', authAnalyticsMiddleware, authRoutes);

// Search routes (public search endpoints)
app.use('/api/search', searchRoutes);

// Product search routes (with algorithm integration)
// These must come before product management routes (more specific paths)
app.use('/api/products', searchRoutes);

// Product management routes (CRUD for sellers)
// Less specific paths, so registered after search routes
app.use('/api/products', productRoutes);

// Product types routes (USDA data)
app.use('/api/product-types', productTypesRoutes);

// User management routes (profile, preferences, location)
app.use('/api/users', preferenceAnalyticsMiddleware, userRoutes);

// Order management routes (mock payment system)
app.use('/api/orders', orderRoutes);

// Analytics routes (dashboard endpoints)
app.use('/api/analytics', analyticsRoutes);

/**
 * Error Handling
 */

// 404 handler (must be after all routes)
app.use(notFound);

// Analytics error tracking (before general error handler)
app.use(errorAnalyticsMiddleware);

// General error handler (must be last)
app.use(errorHandler);

/**
 * Start server function
 */
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔗 Testing database connection...');
    await testConnection();
    
    // Start listening
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✓ Server running in ${config.server.env} mode`);
      console.log(`✓ Listening on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Export app for testing
module.exports = app;

// Start server if not imported
if (require.main === module) {
  startServer();
}
