const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const VALID_ENVS = new Set(['development', 'test', 'staging', 'production']);

let loaded = false;
let validated = false;

const toInt = (name, value, fallback) => {
  const raw = value ?? fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer. Received: ${raw}`);
  }
  return parsed;
};

const assertRequired = (name, value) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
};

const assertUrl = (name, value) => {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
  } catch (err) {
    throw new Error(`Environment variable ${name} must be a valid URL. Received: ${value}`);
  }
};

const inferEnv = () => {
  const candidate = process.env.NODE_ENV || 'development';
  return VALID_ENVS.has(candidate) ? candidate : 'development';
};

const loadEnvironment = () => {
  if (loaded) {
    return;
  }

  const env = inferEnv();
  const serverRoot = path.resolve(__dirname, '..');

  // Load env files from most specific to most general.
  // Since override=false, the first value loaded for each key wins.
  const candidates = [
    path.join(serverRoot, `.env.${env}.local`),
    path.join(serverRoot, `.env.${env}`),
    path.join(serverRoot, '.env.local'),
    path.join(serverRoot, '.env'),
    path.resolve(serverRoot, '../.env'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    dotenv.config({
      path: filePath,
      override: false,
    });
  }

  // Guarantee NODE_ENV is always set to a validated runtime value.
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = env;
  }

  loaded = true;
};

const validateEnvironment = () => {
  if (validated) {
    return;
  }

  loadEnvironment();

  const env = process.env.NODE_ENV || 'development';
  if (!VALID_ENVS.has(env)) {
    throw new Error(`NODE_ENV must be one of: ${Array.from(VALID_ENVS).join(', ')}. Received: ${env}`);
  }

  const defaults = {
    development: {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'chenda',
      DB_USER: 'postgres',
      FRONTEND_URL: 'http://localhost:3000',
      PORT: '3001',
      SESSION_MAX_AGE: '86400000',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
      AUTH_RATE_LIMIT_WINDOW_MS: '900000',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '20',
      MAX_FILE_SIZE: '5242880',
      UPLOAD_DIR: './uploads',
    },
    test: {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'chenda_test',
      DB_USER: 'postgres',
      FRONTEND_URL: 'http://localhost:3000',
      PORT: '3002',
      SESSION_MAX_AGE: '86400000',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '1000',
      AUTH_RATE_LIMIT_WINDOW_MS: '900000',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '1000',
      MAX_FILE_SIZE: '5242880',
      UPLOAD_DIR: './uploads_test',
    },
    staging: {
      DB_PORT: '5432',
      PORT: '3001',
      SESSION_MAX_AGE: '86400000',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
      AUTH_RATE_LIMIT_WINDOW_MS: '900000',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '20',
      MAX_FILE_SIZE: '5242880',
      UPLOAD_DIR: './uploads',
    },
    production: {
      DB_PORT: '5432',
      PORT: '3001',
      SESSION_MAX_AGE: '86400000',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
      AUTH_RATE_LIMIT_WINDOW_MS: '900000',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '20',
      MAX_FILE_SIZE: '5242880',
      UPLOAD_DIR: './uploads',
    },
  };

  // Process values take precedence over defaults.
  const merged = { ...defaults[env], ...process.env };

  const requiredAlways = ['DB_HOST', 'DB_NAME', 'DB_USER', 'FRONTEND_URL'];
  const requiredSecure = ['DB_PASSWORD', 'SESSION_SECRET'];

  // Make tests self-contained when SESSION_SECRET is not explicitly provided.
  if (env === 'test' && !merged.SESSION_SECRET) {
    merged.SESSION_SECRET = 'test-session-secret-not-for-production';
  }

  for (const name of requiredAlways) {
    assertRequired(name, merged[name]);
  }

  assertRequired('SESSION_SECRET', merged.SESSION_SECRET);

  // Enforce stricter guarantees for deployed environments.
  if ((env === 'production' || env === 'staging') && process.env.IS_DOCKER !== 'true') {
    for (const name of requiredSecure) {
      assertRequired(name, merged[name]);
    }

    if (String(merged.SESSION_SECRET).length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters in staging/production.');
    }
  }

  assertUrl('FRONTEND_URL', merged.FRONTEND_URL);

  const intFields = [
    ['DB_PORT', merged.DB_PORT],
    ['PORT', merged.PORT],
    ['SESSION_MAX_AGE', merged.SESSION_MAX_AGE],
    ['RATE_LIMIT_WINDOW_MS', merged.RATE_LIMIT_WINDOW_MS],
    ['RATE_LIMIT_MAX_REQUESTS', merged.RATE_LIMIT_MAX_REQUESTS],
    ['AUTH_RATE_LIMIT_WINDOW_MS', merged.AUTH_RATE_LIMIT_WINDOW_MS],
    ['AUTH_RATE_LIMIT_MAX_REQUESTS', merged.AUTH_RATE_LIMIT_MAX_REQUESTS],
    ['MAX_FILE_SIZE', merged.MAX_FILE_SIZE],
  ];

  for (const [name, value] of intFields) {
    const parsed = toInt(name, value, defaults[env][name]);
    if (parsed <= 0) {
      throw new Error(`Environment variable ${name} must be greater than 0. Received: ${parsed}`);
    }
    // Store normalized string values because process.env is string-based.
    merged[name] = String(parsed);
  }

  if (merged.UPLOAD_DIR) {
    assertRequired('UPLOAD_DIR', merged.UPLOAD_DIR);
  }

  // Normalize process.env with validated values to keep runtime behavior consistent.
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) {
      process.env[key] = String(value);
    }
  }

  validated = true;
};

module.exports = {
  loadEnvironment,
  validateEnvironment,
};
