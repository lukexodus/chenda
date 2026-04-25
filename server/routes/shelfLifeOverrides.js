/**
 * Routes: Shelf Life Overrides API
 * 
 * Mounted at /api/shelf-life
 * 
 * Endpoints:
 * - POST /overrides — Create override
 * - GET /overrides — List seller overrides
 * - GET /overrides/:overrideId — Get specific override
 * - PATCH /overrides/:overrideId — Update override
 * - DELETE /overrides/:overrideId — Delete override
 * - GET /product-types — List available product types
 */

const express = require('express');
const router = express.Router();
const {
  createShelfLifeOverride,
  getSellerOverrides,
  getOverrideById,
  updateOverride,
  deleteOverride,
  listProductTypes
} = require('../controllers/shelfLifeOverridesController');

const { isAuthenticated, isSeller } = require('../middleware/authenticate');

// ============================================
// PRODUCT TYPES (Public - no auth required)
// ============================================

/**
 * GET /api/shelf-life/product-types
 * List all product types available for overrides
 * 
 * Query params:
 * - source: 'usda' | 'regional'
 * - region: region name
 * - ph_available: boolean
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
router.get('/product-types', listProductTypes);

// ============================================
// SHELF LIFE OVERRIDES (Protected - requires auth + seller role)
// ============================================

/**
 * POST /api/shelf-life/overrides
 * Create a new shelf life override
 * 
 * Auth: Seller (or both)
 * 
 * Body:
 * {
 *   "product_type_id": 301,
 *   "override_shelf_life_days": 180,
 *   "override_storage_condition": "pantry",
 *   "reason": "Ilocos garlic stores longer..."
 * }
 */
router.post('/overrides', isAuthenticated, isSeller, createShelfLifeOverride);

/**
 * GET /api/shelf-life/overrides
 * List all overrides for authenticated seller
 * 
 * Auth: Seller (or both)
 * 
 * Query:
 * - product_type_id: optional filter
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
router.get('/overrides', isAuthenticated, isSeller, getSellerOverrides);

/**
 * GET /api/shelf-life/overrides/:overrideId
 * Get specific override
 * 
 * Auth: Seller (must be owner)
 */
router.get('/overrides/:overrideId', isAuthenticated, isSeller, getOverrideById);

/**
 * PATCH /api/shelf-life/overrides/:overrideId
 * Update an override
 * 
 * Auth: Seller (must be owner)
 * 
 * Body: (all optional)
 * {
 *   "override_shelf_life_days": 180,
 *   "override_storage_condition": "pantry",
 *   "reason": "Updated reason..."
 * }
 */
router.patch('/overrides/:overrideId', isAuthenticated, isSeller, updateOverride);

/**
 * DELETE /api/shelf-life/overrides/:overrideId
 * Delete an override
 * 
 * Auth: Seller (must be owner)
 */
router.delete('/overrides/:overrideId', isAuthenticated, isSeller, deleteOverride);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
