/**
 * Product Model
 * Handles database operations for products with PostGIS distance calculations
 * and shelf life metrics for algorithm integration
 */

const { query } = require('../config/database');

const Product = {};

/**
 * Get products with calculated metrics (distance, shelf life) for algorithm input
 * This is the main method for feeding data to the Chenda algorithm
 * 
 * @param {Object} buyerLocation - Buyer's location {lat: number, lng: number}
 * @param {Object} filters - Optional filters
 * @param {number} [filters.max_radius_km] - Maximum distance in km (for database optimization)
 * @param {number} [filters.seller_id] - Filter by specific seller
 * @param {number} [filters.product_type_id] - Filter by product type
 * @param {boolean} [filters.available_only=true] - Only show available products
 * @returns {Promise<Array>} Products with distance_km, total_shelf_life_days, etc.
 */
Product.getProductsWithMetrics = async (buyerLocation, filters = {}) => {
  const {
    max_radius_km = null,
    seller_id = null,
    product_type_id = null,
    available_only = true
  } = filters;

  // Validate buyer location
  if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lng !== 'number') {
    throw new Error('Invalid buyer location: must have lat and lng');
  }

  // Build the query with PostGIS distance calculation
  let queryText = `
    SELECT 
      p.id,
      p.seller_id,
      p.product_type_id,
      p.days_already_used,
      p.listed_date,
      p.price,
      p.quantity,
      p.unit,
      p.storage_condition,
      p.description,
      p.image_url,
      p.status,
      p.address,
      
      -- PostGIS distance calculation in kilometers
      ST_Distance(
        p.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) / 1000 AS distance_km,
      
      -- Extract lat/lng for algorithm
      ST_Y(p.location::geometry) AS latitude,
      ST_X(p.location::geometry) AS longitude,
      
      -- Product type data (for shelf life calculation)
      pt.name AS product_name,
      pt.name_subtitle,
      pt.category_id,
      pt.default_shelf_life_days AS total_shelf_life_days,
      pt.default_storage_condition,
      
      -- Seller information
      u.name AS seller_name,
      u.email AS seller_email,
      u.address AS seller_address,
      
      -- Timestamps
      p.created_at,
      p.updated_at
      
    FROM products p
    INNER JOIN product_types pt ON p.product_type_id = pt.id
    INNER JOIN users u ON p.seller_id = u.id
    WHERE 1=1
  `;

  const params = [buyerLocation.lng, buyerLocation.lat]; // PostGIS uses (lng, lat) order
  let paramCount = 2;

  // Add filters
  if (available_only) {
    queryText += " AND p.status = 'active' AND p.quantity > 0";
  }

  if (max_radius_km !== null) {
    paramCount++;
    queryText += ` AND ST_DWithin(
      p.location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $${paramCount} * 1000
    )`;
    params.push(max_radius_km);
  }

  if (seller_id !== null) {
    paramCount++;
    queryText += ` AND p.seller_id = $${paramCount}`;
    params.push(seller_id);
  }

  if (product_type_id !== null) {
    paramCount++;
    queryText += ` AND p.product_type_id = $${paramCount}`;
    params.push(product_type_id);
  }

  queryText += ' ORDER BY distance_km ASC';

  const result = await query(queryText, params);
  
  // Transform results to match algorithm expected format
  return result.rows.map(row => ({
    id: row.id,
    name: row.product_name,
    name_subtitle: row.name_subtitle,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_email: row.seller_email,
    seller_address: row.seller_address,
    product_type_id: row.product_type_id,
    category_id: row.category_id,
    
    // Pricing
    price: parseFloat(row.price),
    quantity: parseFloat(row.quantity),
    unit: row.unit,
    
    // Location (for algorithm)
    location: {
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude)
    },
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    address: row.address,
    distance_km: parseFloat(row.distance_km),
    
    // Shelf life data (for algorithm)
    total_shelf_life_days: row.total_shelf_life_days,
    default_storage_condition: row.default_storage_condition,
    storage_condition: row.storage_condition,
    days_already_used: row.days_already_used,
    listed_date: row.listed_date,
    
    // Additional info
    description: row.description,
    image_url: row.image_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
};

/**
 * Get a single product by ID
 * 
 * @param {number} id - Product ID
 * @returns {Promise<Object|null>} Product or null if not found
 */
Product.findById = async (id) => {
  const queryText = `
    SELECT 
      p.*,
      ST_Y(p.location::geometry) AS latitude,
      ST_X(p.location::geometry) AS longitude,
      pt.name AS product_name,
      pt.name_subtitle,
      pt.default_shelf_life_days AS total_shelf_life_days,
      pt.default_storage_condition,
      u.name AS seller_name,
      u.email AS seller_email
    FROM products p
    INNER JOIN product_types pt ON p.product_type_id = pt.id
    INNER JOIN users u ON p.seller_id = u.id
    WHERE p.id = $1
  `;

  const result = await query(queryText, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.product_name,
    name_subtitle: row.name_subtitle,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_email: row.seller_email,
    product_type_id: row.product_type_id,
    days_already_used: row.days_already_used,
    listed_date: row.listed_date,
    price: parseFloat(row.price),
    quantity: parseFloat(row.quantity),
    unit: row.unit,
    location: {
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude)
    },
    address: row.address,
    storage_condition: row.storage_condition,
    description: row.description,
    image_url: row.image_url,
    status: row.status,
    total_shelf_life_days: row.total_shelf_life_days,
    default_storage_condition: row.default_storage_condition,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

/**
 * Create a new product
 * 
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
Product.create = async (productData) => {
  const {
    seller_id,
    product_type_id,
    days_already_used = 0,
    price,
    quantity,
    unit = 'pieces',
    location, // { lat, lng }
    address,
    storage_condition,
    description,
    image_url
  } = productData;

  // Validate required fields
  if (!seller_id || !product_type_id || price == null || quantity == null || !location) {
    throw new Error('Missing required fields for product creation');
  }

  // Validate location
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('Invalid location: must have numeric lat and lng');
  }

  const queryText = `
    INSERT INTO products (
      seller_id, product_type_id, days_already_used, price, quantity, unit,
      location, address, storage_condition, description, image_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10, $11, $12)
    RETURNING 
      id, seller_id, product_type_id, days_already_used, listed_date, price, quantity, unit,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      address, storage_condition, description, image_url, status, created_at, updated_at
  `;

  const params = [
    seller_id,
    product_type_id,
    days_already_used,
    price,
    quantity,
    unit,
    location.lng, // PostGIS uses (lng, lat)
    location.lat,
    address,
    storage_condition,
    description,
    image_url
  ];

  const result = await query(queryText, params);
  const row = result.rows[0];

  return {
    id: row.id,
    seller_id: row.seller_id,
    product_type_id: row.product_type_id,
    days_already_used: row.days_already_used,
    listed_date: row.listed_date,
    price: parseFloat(row.price),
    quantity: parseFloat(row.quantity),
    unit: row.unit,
    location: {
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude)
    },
    address: row.address,
    storage_condition: row.storage_condition,
    description: row.description,
    image_url: row.image_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

/**
 * Update a product
 * 
 * @param {number} id - Product ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated product
 */
Product.update = async (id, updates) => {
  const allowedFields = [
    'days_already_used', 'price', 'quantity', 'unit', 'storage_condition',
    'description', 'image_url', 'status', 'address'
  ];

  const updateFields = [];
  const params = [id];
  let paramCount = 1;

  Object.keys(updates).forEach(field => {
    if (allowedFields.includes(field)) {
      paramCount++;
      updateFields.push(`${field} = $${paramCount}`);
      params.push(updates[field]);
    }
  });

  // Handle location update separately (PostGIS)
  if (updates.location && updates.location.lat && updates.location.lng) {
    paramCount++;
    updateFields.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`);
    params.push(updates.location.lng, updates.location.lat);
    paramCount++;
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');

  const queryText = `
    UPDATE products
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING 
      id, seller_id, product_type_id, days_already_used, listed_date, price, quantity, unit,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      address, storage_condition, description, image_url, status, created_at, updated_at
  `;

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    seller_id: row.seller_id,
    product_type_id: row.product_type_id,
    days_already_used: row.days_already_used,
    listed_date: row.listed_date,
    price: parseFloat(row.price),
    quantity: parseFloat(row.quantity),
    unit: row.unit,
    location: {
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude)
    },
    address: row.address,
    storage_condition: row.storage_condition,
    description: row.description,
    image_url: row.image_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

/**
 * Delete a product
 * 
 * @param {number} id - Product ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
Product.delete = async (id) => {
  const queryText = 'DELETE FROM products WHERE id = $1 RETURNING id';
  const result = await query(queryText, [id]);
  return result.rows.length > 0;
};

/**
 * Get products by seller
 * 
 * @param {number} seller_id - Seller ID
 * @returns {Promise<Array>} Products
 */
Product.findBySeller = async (seller_id) => {
  const queryText = `
    SELECT 
      p.*,
      ST_Y(p.location::geometry) AS latitude,
      ST_X(p.location::geometry) AS longitude,
      pt.name AS product_name,
      pt.name_subtitle,
      pt.default_shelf_life_days AS total_shelf_life_days
    FROM products p
    INNER JOIN product_types pt ON p.product_type_id = pt.id
    WHERE p.seller_id = $1
    ORDER BY p.created_at DESC
  `;

  const result = await query(queryText, [seller_id]);
  return result.rows.map(row => ({
    id: row.id,
    name: row.product_name,
    name_subtitle: row.name_subtitle,
    seller_id: row.seller_id,
    product_type_id: row.product_type_id,
    days_already_used: row.days_already_used,
    listed_date: row.listed_date,
    price: parseFloat(row.price),
    quantity: parseFloat(row.quantity),
    unit: row.unit,
    location: {
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude)
    },
    address: row.address,
    storage_condition: row.storage_condition,
    description: row.description,
    image_url: row.image_url,
    status: row.status,
    total_shelf_life_days: row.total_shelf_life_days,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
};

module.exports = Product;
