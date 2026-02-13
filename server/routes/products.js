/**
 * Product Management Routes
 * API endpoints for CRUD operations on products (sellers only)
 */

const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  uploadImage
} = require('../controllers/productController');
const { isAuthenticated, isSeller } = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const { uploadSingle } = require('../middleware/uploadImage');
const {
  validateCreateProduct,
  validateUpdateProduct,
  checkValidation
} = require('../middleware/validateProduct');

// POST /api/products/upload-image - Upload product image (sellers only)
router.post('/upload-image', isAuthenticated, isSeller, uploadSingle, asyncHandler(uploadImage));

// POST /api/products - Create new product (sellers only)
router.post('/', isAuthenticated, isSeller, validateCreateProduct, checkValidation, asyncHandler(createProduct));

// GET /api/products - Get all products for authenticated seller
router.get('/', isAuthenticated, isSeller, asyncHandler(getMyProducts));

// GET /api/products/:id - Get single product by ID (public)
router.get('/:id', asyncHandler(getProductById));

// PUT /api/products/:id - Update product (owner only, verified in controller)
router.put('/:id', isAuthenticated, isSeller, validateUpdateProduct, checkValidation, asyncHandler(updateProduct));

// DELETE /api/products/:id - Delete product (owner only, verified in controller)
router.delete('/:id', isAuthenticated, isSeller, asyncHandler(deleteProduct));

module.exports = router;
