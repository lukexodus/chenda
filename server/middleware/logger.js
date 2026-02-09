const morgan = require('morgan');

/**
 * HTTP request logger middleware
 * Uses morgan for logging HTTP requests
 */

// Custom token for response time coloring
morgan.token('colored-status', (req, res) => {
  const status = res.statusCode;
  let color = '\x1b[32m'; // Green for 2xx
  
  if (status >= 500) color = '\x1b[31m'; // Red for 5xx
  else if (status >= 400) color = '\x1b[33m'; // Yellow for 4xx
  else if (status >= 300) color = '\x1b[36m'; // Cyan for 3xx
  
  return `${color}${status}\x1b[0m`;
});

// Development format: detailed with colors
const devFormat = ':method :url :colored-status :response-time ms - :res[content-length]';

// Production format: combined log format
const prodFormat = 'combined';

/**
 * Get logger middleware based on environment
 */
const getLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    // In production, use combined format and log to file
    return morgan(prodFormat);
  }
  
  // In development, use custom colored format
  return morgan(devFormat);
};

module.exports = getLogger;
