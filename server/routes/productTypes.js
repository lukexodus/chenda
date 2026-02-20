/**
 * Product Types Routes
 * API endpoints for fetching USDA product types
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/product-types
 * Get all product types (with optional search)
 * Access: Public (needed for product creation form)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;

  let queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition
    FROM product_types
    WHERE 1=1
  `;

  const params = [];

  if (search && search.trim() !== '') {
    queryText += ` AND (
      name ILIKE $1 OR
      name_subtitle ILIKE $1 OR
      keywords ILIKE $1
    )`;
    params.push(`%${search.trim()}%`);
  }

  queryText += ' ORDER BY name ASC, name_subtitle ASC';

  const result = await query(queryText, params);

  res.json({
    success: true,
    product_types: result.rows,
    total: result.rows.length
  });
}));

/**
 * GET /api/product-types/:id
 * Get single product type by ID
 * Access: Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM product_types WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Product type not found'
    });
  }

  res.json({
    success: true,
    product_type: result.rows[0]
  });
}));

module.exports = router;
