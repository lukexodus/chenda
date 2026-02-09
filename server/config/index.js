require('dotenv').config();

/**
 * Server configuration
 * Centralized configuration for the entire application
 */
module.exports = {
  // Server settings
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },
  
  // Database settings
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'chenda',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  // Session settings
  session: {
    secret: process.env.SESSION_SECRET || 'chenda-secret-key-change-this-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours in milliseconds
    name: 'chenda.sid',
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  },
  
  // CORS settings
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  
  // Rate limiting settings
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // File upload settings
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadDir: './uploads',
  },
};
