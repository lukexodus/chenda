/**
 * Search Routes
 * API endpoints for product search with Chenda algorithm
 */

const express = require('express');
const router = express.Router();
const { searchProducts, getNearbyProducts } = require('../controllers/searchController');
const { isAuthenticated } = require('../middleware/authenticate');

// POST /api/products/search - Main search endpoint with algorithm
// Can be used with or without authentication
// If authenticated, uses user preferences
router.post('/search', searchProducts);

// GET /api/products/nearby - Quick nearby products search
// Simplified endpoint without algorithm processing
router.get('/nearby', getNearbyProducts);

// Protected search endpoint (requires authentication, ensures user preferences are applied)
router.post('/search/personalized', isAuthenticated, searchProducts);

module.exports = router;
