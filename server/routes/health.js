const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/health
 * @desc    Health check endpoint - verifies server and database status
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  // Check database connection
  const dbResult = await query('SELECT NOW() as time, version() as version');
  
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    server: {
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      port: process.env.PORT || 3001,
    },
    database: {
      connected: true,
      time: dbResult.rows[0].time,
      version: dbResult.rows[0].version.split(',')[0],
    },
  });
}));

module.exports = router;
