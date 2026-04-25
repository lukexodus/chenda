/**
 * Shelf Life Overrides Controller
 * Manages custom shelf life settings for seller products
 * 
 * Endpoints:
 * - POST /api/shelf-life/overrides — Create override
 * - GET /api/shelf-life/overrides — List overrides for seller
 * - GET /api/shelf-life/overrides/:overrideId — Get specific override
 * - PATCH /api/shelf-life/overrides/:overrideId — Update override
 * - DELETE /api/shelf-life/overrides/:overrideId — Delete override
 */

const { query } = require('../config/database');
const db = { query };
const { asyncHandler } = require('../middleware/errorHandler');

// ============================================
// CREATE SHELF LIFE OVERRIDE
// ============================================

/**
 * POST /api/shelf-life/overrides
 * Create a custom shelf life override for a seller product
 * 
 * @body {Object} request body
 * @body {number} product_type_id - Product type to override
 * @body {number} override_shelf_life_days - Custom shelf life in days
 * @body {string} override_storage_condition - Custom storage condition (optional)
 * @body {string} reason - Reason for override (optional)
 * 
 * @returns {Object} Created override record
 * 
 * @example
 * POST /api/shelf-life/overrides
 * {
 *   "product_type_id": 301,
 *   "override_shelf_life_days": 180,
 *   "override_storage_condition": "pantry",
 *   "reason": "Ilocos garlic stores longer in local conditions"
 * }
 */
const createShelfLifeOverride = asyncHandler(async (req, res) => {
  const { product_type_id, override_shelf_life_days, override_storage_condition, reason } = req.body;
  const seller_id = req.user.id;

  // Validate seller
  if (!seller_id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Only sellers can create shelf life overrides.'
    });
  }

  // Validate required fields
  if (!product_type_id || !override_shelf_life_days) {
    return res.status(400).json({
      success: false,
      message: 'product_type_id and override_shelf_life_days are required'
    });
  }

  // Validate shelf life is positive
  if (override_shelf_life_days <= 0) {
    return res.status(400).json({
      success: false,
      message: 'override_shelf_life_days must be positive'
    });
  }

  // Verify product type exists
  const typeCheck = await db.query(
    'SELECT id FROM product_types WHERE id = $1',
    [product_type_id]
  );

  if (typeCheck.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: `Product type ${product_type_id} not found`
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO product_shelf_life_overrides (
        seller_id, product_type_id, override_shelf_life_days,
        override_storage_condition, reason
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (seller_id, product_type_id)
      DO UPDATE SET
        override_shelf_life_days = $3,
        override_storage_condition = $4,
        reason = $5,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [seller_id, product_type_id, override_shelf_life_days, override_storage_condition || null, reason || null]
    );

    res.status(201).json({
      success: true,
      message: 'Shelf life override created/updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    throw error;
  }
});

// ============================================
// GET SELLER'S OVERRIDES
// ============================================

/**
 * GET /api/shelf-life/overrides
 * List all shelf life overrides for the authenticated seller
 * 
 * @query {number} page - Pagination (default: 1)
 * @query {number} limit - Results per page (default: 20)
 * @query {number} product_type_id - Filter by product type (optional)
 * 
 * @returns {Object} Array of overrides with pagination
 */
const getSellerOverrides = asyncHandler(async (req, res) => {
  const seller_id = req.user.id;
  const { page = 1, limit = 20, product_type_id } = req.query;
  const offset = (page - 1) * limit;

  if (!seller_id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  let query = `
    SELECT 
      pso.*,
      pt.name as product_name,
      pt.name_subtitle,
      pt.source,
      pt.region,
      pt.default_shelf_life_days,
      pt.default_storage_condition
    FROM product_shelf_life_overrides pso
    JOIN product_types pt ON pso.product_type_id = pt.id
    WHERE pso.seller_id = $1
  `;

  const params = [seller_id];

  if (product_type_id) {
    params.push(product_type_id);
    query += ` AND pso.product_type_id = $${params.length}`;
  }

  query += ` ORDER BY pso.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM product_shelf_life_overrides WHERE seller_id = $1';
  if (product_type_id) {
    countQuery += ' AND product_type_id = $2';
  }
  const countParams = product_type_id ? [seller_id, product_type_id] : [seller_id];
  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// ============================================
// GET SPECIFIC OVERRIDE
// ============================================

/**
 * GET /api/shelf-life/overrides/:overrideId
 * Get a specific shelf life override
 */
const getOverrideById = asyncHandler(async (req, res) => {
  const { overrideId } = req.params;
  const seller_id = req.user.id;

  const result = await db.query(
    `SELECT 
      pso.*,
      pt.name as product_name,
      pt.name_subtitle,
      pt.source,
      pt.region,
      pt.default_shelf_life_days,
      pt.default_storage_condition,
      u.name as seller_name
    FROM product_shelf_life_overrides pso
    JOIN product_types pt ON pso.product_type_id = pt.id
    JOIN users u ON pso.seller_id = u.id
    WHERE pso.id = $1 AND pso.seller_id = $2`,
    [overrideId, seller_id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Shelf life override not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// ============================================
// UPDATE OVERRIDE
// ============================================

/**
 * PATCH /api/shelf-life/overrides/:overrideId
 * Update an existing override
 */
const updateOverride = asyncHandler(async (req, res) => {
  const { overrideId } = req.params;
  const seller_id = req.user.id;
  const { override_shelf_life_days, override_storage_condition, reason } = req.body;

  // Verify ownership
  const existingCheck = await db.query(
    'SELECT id FROM product_shelf_life_overrides WHERE id = $1 AND seller_id = $2',
    [overrideId, seller_id]
  );

  if (existingCheck.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Shelf life override not found or you do not have permission'
    });
  }

  // Build update query dynamically
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (override_shelf_life_days !== undefined) {
    if (override_shelf_life_days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'override_shelf_life_days must be positive'
      });
    }
    updates.push(`override_shelf_life_days = $${paramCount++}`);
    params.push(override_shelf_life_days);
  }

  if (override_storage_condition !== undefined) {
    updates.push(`override_storage_condition = $${paramCount++}`);
    params.push(override_storage_condition || null);
  }

  if (reason !== undefined) {
    updates.push(`reason = $${paramCount++}`);
    params.push(reason || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update'
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(overrideId);

  const result = await db.query(
    `UPDATE product_shelf_life_overrides
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *`,
    params
  );

  res.json({
    success: true,
    message: 'Override updated successfully',
    data: result.rows[0]
  });
});

// ============================================
// DELETE OVERRIDE
// ============================================

/**
 * DELETE /api/shelf-life/overrides/:overrideId
 * Delete a shelf life override
 */
const deleteOverride = asyncHandler(async (req, res) => {
  const { overrideId } = req.params;
  const seller_id = req.user.id;

  const result = await db.query(
    'DELETE FROM product_shelf_life_overrides WHERE id = $1 AND seller_id = $2 RETURNING id',
    [overrideId, seller_id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Shelf life override not found or you do not have permission'
    });
  }

  res.json({
    success: true,
    message: 'Override deleted successfully',
    data: { id: result.rows[0].id }
  });
});

// ============================================
// LIST AVAILABLE PRODUCT TYPES
// ============================================

/**
 * GET /api/shelf-life/product-types
 * List all product types available for overrides (both USDA and regional)
 * 
 * @query {string} source - Filter by source ('usda' or 'regional')
 * @query {string} region - Filter by region (for regional types)
 * @query {boolean} ph_available - Filter by Philippines availability
 */
const listProductTypes = asyncHandler(async (req, res) => {
  const { source, region, ph_available } = req.query;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, name, name_subtitle, category_id, source, region, default_shelf_life_days, is_available_in_philippines FROM product_types WHERE 1=1';
  const params = [];

  if (source) {
    params.push(source);
    query += ` AND source = $${params.length}`;
  }

  if (region) {
    params.push(region);
    query += ` AND region = $${params.length}`;
  }

  if (ph_available === 'true') {
    query += ` AND is_available_in_philippines = true`;
  }

  query += ` ORDER BY source DESC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM product_types WHERE 1=1';
  const countParams = [...params.slice(0, -2)];

  if (source) {
    countQuery += ` AND source = $${countParams.length}`;
  }
  if (region) {
    countQuery += ` AND region = $${countParams.length}`;
  }
  if (ph_available === 'true') {
    countQuery += ` AND is_available_in_philippines = true`;
  }

  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createShelfLifeOverride,
  getSellerOverrides,
  getOverrideById,
  updateOverride,
  deleteOverride,
  listProductTypes
};
