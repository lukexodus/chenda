/**
 * Product Validation Middleware
 * Validates product data using express-validator
 */

const { body, validationResult } = require('express-validator');

// Validation rules for creating a product
const validateCreateProduct = [
  // ── Path A: existing product type ──────────────────────────────────────────
  body('product_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('product_type_id must be a positive integer'),

  // ── Path B: custom product (not in catalog) ─────────────────────────────────
  body('custom_product_name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('custom_product_name must be between 1 and 255 characters'),

  body('custom_shelf_life_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('custom_shelf_life_days must be a positive integer'),

  // ── Cross-field: require exactly one path ───────────────────────────────────
  body().custom((_, { req }) => {
    const hasTypeId = req.body.product_type_id != null;
    const hasCustom = req.body.custom_product_name != null;

    if (!hasTypeId && !hasCustom) {
      throw new Error('Either product_type_id or custom_product_name must be provided');
    }
    if (hasTypeId && hasCustom) {
      throw new Error('Provide either product_type_id or custom_product_name, not both');
    }
    if (hasCustom && req.body.custom_shelf_life_days == null) {
      throw new Error('custom_shelf_life_days is required when using a custom product name');
    }
    return true;
  }),

  body('days_already_used')
    .optional()
    .isInt({ min: 0 })
    .withMessage('days_already_used must be a non-negative integer'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('price must be a non-negative number'),

  body('quantity')
    .isFloat({ gt: 0 })
    .withMessage('quantity must be greater than 0'),

  body('unit')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('unit must be a string between 1 and 50 characters'),

  body('location')
    .exists()
    .withMessage('location is required'),

  body('location.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),

  body('location.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),

  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('address must be a string with max 500 characters'),

  body('storage_condition')
    .optional()
    .isIn(['pantry', 'pantry_opened', 'refrigerated', 'refrigerated_opened', 'frozen', 'frozen_opened'])
    .withMessage('storage_condition must be one of: pantry, pantry_opened, refrigerated, refrigerated_opened, frozen, frozen_opened'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('description must be a string with max 2000 characters'),

  body('image_url')
    .optional()
    .isString()
    .trim()
    .withMessage('image_url must be a string')
];

// Validation rules for updating a product
const validateUpdateProduct = [
  body('days_already_used')
    .optional()
    .isInt({ min: 0 })
    .withMessage('days_already_used must be a non-negative integer'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('price must be a non-negative number'),
  
  body('quantity')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('quantity must be greater than 0'),
  
  body('unit')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('unit must be a string between 1 and 50 characters'),
  
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),
  
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),
  
  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('address must be a string with max 500 characters'),
  
  body('storage_condition')
    .optional()
    .isIn(['pantry', 'pantry_opened', 'refrigerated', 'refrigerated_opened', 'frozen', 'frozen_opened'])
    .withMessage('storage_condition must be one of: pantry, pantry_opened, refrigerated, refrigerated_opened, frozen, frozen_opened'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('description must be a string with max 2000 characters'),
  
  body('image_url')
    .optional()
    .isString()
    .trim()
    .withMessage('image_url must be a string'),
  
  body('status')
    .optional()
    .isIn(['active', 'sold', 'expired', 'removed'])
    .withMessage('status must be one of: active, sold, expired, removed')
];

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errList = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    console.error('[validateProduct] Validation errors:', JSON.stringify(errList, null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errList
    });
  }
  
  next();
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  checkValidation
};
