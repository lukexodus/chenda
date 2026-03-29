const { validateEnvironment } = require('./env');

validateEnvironment();

const env = process.env.NODE_ENV;
const isProduction = env === 'production';
const isStaging = env === 'staging';
const isTest = env === 'test';

/**
 * Server configuration
 * Centralized configuration for the entire application
 */
module.exports = {
  // Server settings
  server: {
    port: Number(process.env.PORT),
    env,
    isDevelopment: env === 'development',
    isProduction,
    isStaging,
    isTest,
  },

  // Database settings
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  },

  // Session settings
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: Number(process.env.SESSION_MAX_AGE), // 24 hours in milliseconds
    name: 'chenda.sid',
    secure: isProduction || isStaging, // HTTPS only in staging/production
  },

  // CORS settings
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },

  // Rate limiting settings (general API)
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS), // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS),
  },

  // Auth-specific rate limiting (stricter — prevents brute force attacks)
  authRateLimit: {
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS), // 15 minutes
    max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS), // 20 attempts per 15 min
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // File upload settings
  upload: {
    maxFileSize: Number(process.env.MAX_FILE_SIZE),
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadDir: process.env.UPLOAD_DIR,
  },
};
