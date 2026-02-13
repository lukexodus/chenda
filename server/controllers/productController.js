/**
 * Product Controller
 * Handles CRUD operations for products (sellers only)
 */

const { query } = require('../config/database');

/**
 * Create a new product
 * POST /api/products
 * Only sellers can create products
 */
const createProduct = async (req, res) => {
  const {
    product_type_id,
    days_already_used = 0,
    price,
    quantity,
    unit = 'pieces',
    location,
    address,
    storage_condition,
    description,
    image_url
  } = req.body;

  const seller_id = req.user.id;

  try {
    // Validate required fields
    if (!product_type_id || !price || !quantity || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: product_type_id, price, quantity, location'
      });
    }

    // Validate location format
    if (!location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'Location must have lat and lng properties'
      });
    }

    // Validate coordinates
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Verify product_type exists and get shelf life
    const productTypeResult = await query(
      'SELECT id, name, default_shelf_life_days, default_storage_condition FROM product_types WHERE id = $1',
      [product_type_id]
    );

    if (productTypeResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product_type_id. Product type not found.'
      });
    }

    const productType = productTypeResult.rows[0];
    const total_shelf_life = productType.default_shelf_life_days;

    // Validate days_already_used
    if (days_already_used < 0) {
      return res.status(400).json({
        success: false,
        message: 'days_already_used cannot be negative'
      });
    }

    if (days_already_used >= total_shelf_life) {
      return res.status(400).json({
        success: false,
        message: `days_already_used (${days_already_used}) must be less than total shelf life (${total_shelf_life} days for ${productType.name})`
      });
    }

    // Use provided storage condition or default from product type
    const finalStorageCondition = storage_condition || productType.default_storage_condition;

    // Validate storage condition
    const validStorageConditions = ['pantry', 'pantry_opened', 'refrigerated', 'refrigerated_opened', 'frozen', 'frozen_opened'];
    if (!validStorageConditions.includes(finalStorageCondition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid storage_condition. Must be one of: ${validStorageConditions.join(', ')}`
      });
    }

    // Insert new product
    const result = await query(
      `INSERT INTO products (
        seller_id, product_type_id, days_already_used, price, quantity, unit,
        location, address, storage_condition, description, image_url, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_MakePoint($7, $8), 4326),
        $9, $10, $11, $12, 'active'
      ) RETURNING 
        id, seller_id, product_type_id, days_already_used, listed_date,
        price, quantity, unit, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat,
        address, storage_condition, description, image_url, status,
        created_at, updated_at`,
      [
        seller_id,
        product_type_id,
        days_already_used,
        price,
        quantity,
        unit,
        location.lng,
        location.lat,
        address,
        finalStorageCondition,
        description,
        image_url
      ]
    );

    const newProduct = result.rows[0];

    // Fetch product type details for response
    newProduct.product_type = {
      id: productType.id,
      name: productType.name,
      default_shelf_life_days: productType.default_shelf_life_days
    };

    // Format location
    newProduct.location = {
      lat: newProduct.lat,
      lng: newProduct.lng
    };
    delete newProduct.lat;
    delete newProduct.lng;

    // Track product creation analytics
    if (req.analytics) {
      req.analytics.track('product_created', {
        product_id: newProduct.id,
        product_type_id: newProduct.product_type_id,
        price: newProduct.price,
        quantity: newProduct.quantity,
        days_already_used: newProduct.days_already_used,
        storage_condition: newProduct.storage_condition,
        has_image: !!newProduct.image_url
      }, seller_id).catch(err => console.error('Product creation analytics error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

/**
 * Get a single product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT 
        p.id,
        p.seller_id,
        p.product_type_id,
        p.days_already_used,
        p.listed_date,
        p.price,
        p.quantity,
        p.unit,
        ST_X(p.location::geometry) as lng,
        ST_Y(p.location::geometry) as lat,
        p.address,
        p.storage_condition,
        p.description,
        p.image_url,
        p.status,
        p.created_at,
        p.updated_at,
        pt.id as pt_id,
        pt.name as pt_name,
        pt.category_id as pt_category_id,
        pt.default_shelf_life_days as pt_shelf_life,
        u.id as seller_user_id,
        u.name as seller_name,
        u.email as seller_email
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const row = result.rows[0];

    // Format response
    const product = {
      id: row.id,
      seller_id: row.seller_id,
      product_type_id: row.product_type_id,
      days_already_used: row.days_already_used,
      listed_date: row.listed_date,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      unit: row.unit,
      location: {
        lat: row.lat,
        lng: row.lng
      },
      address: row.address,
      storage_condition: row.storage_condition,
      description: row.description,
      image_url: row.image_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Flattened seller info for backward compatibility
      seller_name: row.seller_name,
      seller_email: row.seller_email,
      product_type: {
        id: row.pt_id,
        name: row.pt_name,
        category_id: row.pt_category_id,
        default_shelf_life_days: row.pt_shelf_life
      },
      seller: {
        id: row.seller_user_id,
        name: row.seller_name,
        email: row.seller_email
      }
    };

    // Track product view analytics
    if (req.analytics) {
      req.analytics.track('product_viewed', {
        product_id: product.id,
        product_type_id: product.product_type_id,
        seller_id: product.seller_id,
        price: product.price,
        view_source: req.get('Referer') ? 'search_results' : 'direct'
      }, req.user?.id).catch(err => console.error('Product view analytics error:', err));
    }

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

/**
 * Get all products for the authenticated user (seller)
 * GET /api/products
 * Optional query params: status, limit, offset
 */
const getMyProducts = async (req, res) => {
  const seller_id = req.user.id;
  const { status = 'active', limit = 50, offset = 0 } = req.query;

  try {
    // Build WHERE clause
    let whereClause = 'WHERE p.seller_id = $1';
    const params = [seller_id];

    if (status && status !== 'all') {
      whereClause += ' AND p.status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT 
        p.id,
        p.seller_id,
        p.product_type_id,
        p.days_already_used,
        p.listed_date,
        p.price,
        p.quantity,
        p.unit,
        ST_X(p.location::geometry) as lng,
        ST_Y(p.location::geometry) as lat,
        p.address,
        p.storage_condition,
        p.description,
        p.image_url,
        p.status,
        p.created_at,
        p.updated_at,
        pt.id as pt_id,
        pt.name as pt_name,
        pt.default_shelf_life_days as pt_shelf_life
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );

    const products = result.rows.map(row => ({
      id: row.id,
      seller_id: row.seller_id,
      product_type_id: row.product_type_id,
      days_already_used: row.days_already_used,
      listed_date: row.listed_date,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      unit: row.unit,
      location: {
        lat: row.lat,
        lng: row.lng
      },
      address: row.address,
      storage_condition: row.storage_condition,
      description: row.description,
      image_url: row.image_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product_type: {
        id: row.pt_id,
        name: row.pt_name,
        default_shelf_life_days: row.pt_shelf_life
      }
    }));

    res.json({
      success: true,
      products: products,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        returned: products.length
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

/**
 * Update a product
 * PUT /api/products/:id
 * Only product owner can update
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const seller_id = req.user.id;

  const {
    days_already_used,
    price,
    quantity,
    unit,
    location,
    address,
    storage_condition,
    description,
    image_url,
    status
  } = req.body;

  try {
    // Verify product exists and user owns it
    const checkResult = await query(
      'SELECT seller_id, product_type_id FROM products WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (checkResult.rows[0].seller_id !== seller_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products.'
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (days_already_used !== undefined) {
      // Validate against shelf life
      if (days_already_used < 0) {
        return res.status(400).json({
          success: false,
          message: 'days_already_used cannot be negative'
        });
      }

      const productTypeId = checkResult.rows[0].product_type_id;
      const ptResult = await query(
        'SELECT default_shelf_life_days FROM product_types WHERE id = $1',
        [productTypeId]
      );

      if (days_already_used >= ptResult.rows[0].default_shelf_life_days) {
        return res.status(400).json({
          success: false,
          message: `days_already_used must be less than total shelf life (${ptResult.rows[0].default_shelf_life_days} days)`
        });
      }

      updates.push(`days_already_used = $${paramCount}`);
      values.push(days_already_used);
      paramCount++;
    }

    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price cannot be negative'
        });
      }
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      updates.push(`quantity = $${paramCount}`);
      values.push(quantity);
      paramCount++;
    }

    if (unit) {
      updates.push(`unit = $${paramCount}`);
      values.push(unit);
      paramCount++;
    }

    if (location) {
      if (!location.lat || !location.lng) {
        return res.status(400).json({
          success: false,
          message: 'Location must have lat and lng properties'
        });
      }

      if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates'
        });
      }

      updates.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`);
      values.push(location.lng, location.lat);
      paramCount += 2;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }

    if (storage_condition) {
      const validStorageConditions = ['pantry', 'pantry_opened', 'refrigerated', 'refrigerated_opened', 'frozen', 'frozen_opened'];
      if (!validStorageConditions.includes(storage_condition)) {
        return res.status(400).json({
          success: false,
          message: `Invalid storage_condition. Must be one of: ${validStorageConditions.join(', ')}`
        });
      }
      updates.push(`storage_condition = $${paramCount}`);
      values.push(storage_condition);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount}`);
      values.push(image_url);
      paramCount++;
    }

    if (status) {
      const validStatuses = ['active', 'sold', 'expired', 'removed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause
    values.push(id);

    const result = await query(
      `UPDATE products SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING 
         id, seller_id, product_type_id, days_already_used, listed_date,
         price, quantity, unit, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat,
         address, storage_condition, description, image_url, status,
         created_at, updated_at`,
      values
    );

    const updatedProduct = result.rows[0];

    // Format location
    updatedProduct.location = {
      lat: updatedProduct.lat,
      lng: updatedProduct.lng
    };
    delete updatedProduct.lat;
    delete updatedProduct.lng;

    // Parse numeric fields
    updatedProduct.price = parseFloat(updatedProduct.price);
    updatedProduct.quantity = parseFloat(updatedProduct.quantity);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

/**
 * Delete a product (soft delete by setting status to 'removed')
 * DELETE /api/products/:id
 * Only product owner can delete
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const seller_id = req.user.id;

  try {
    // Verify product exists and user owns it
    const checkResult = await query(
      'SELECT seller_id FROM products WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (checkResult.rows[0].seller_id !== seller_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own products.'
      });
    }

    // Soft delete (set status to 'removed')
    await query(
      `UPDATE products SET status = 'removed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

/**
 * Upload product image
 * POST /api/products/upload-image
 * Returns the URL of the uploaded image
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Generate image URL
    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  uploadImage
};
