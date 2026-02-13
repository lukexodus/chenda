/**
 * Search Routes
 * API endpoints for product search with Chenda algorithm
 */

const express = require('express');
const router = express.Router();
const { searchProducts, getNearbyProducts, publicSearch } = require('../controllers/searchController');
const { isAuthenticated } = require('../middleware/authenticate');

// POST /api/products/search - Main search endpoint with algorithm (requires authentication)
router.post('/search', isAuthenticated, searchProducts);

// GET /api/products/nearby - Quick nearby products search
// Simplified endpoint without algorithm processing
router.get('/nearby', getNearbyProducts);

// Protected search endpoint (requires authentication, ensures user preferences are applied)
router.post('/search/personalized', isAuthenticated, searchProducts);

// GET /api/search/public - Public search with algorithm (for separate mount)
router.get('/public', publicSearch);

module.exports = router;
