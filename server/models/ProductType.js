/**
 * ProductType Model
 * Handles database operations for product types (USDA FoodKeeper data)
 * Provides shelf life information for products
 */

const { query } = require('../config/database');

const ProductType = {};

/**
 * Get all product types
 * 
 * @param {Object} filters - Optional filters
 * @param {number} [filters.category_id] - Filter by category
 * @param {string} [filters.search] - Search in name and keywords
 * @returns {Promise<Array>} Product types
 */
ProductType.findAll = async (filters = {}) => {
  const { category_id = null, search = null } = filters;

  let queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition,
      shelf_life_source,
      created_at,
      updated_at
    FROM product_types
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 0;

  if (category_id !== null) {
    paramCount++;
    queryText += ` AND category_id = $${paramCount}`;
    params.push(category_id);
  }

  if (search !== null && search.trim() !== '') {
    paramCount++;
    queryText += ` AND (
      name ILIKE $${paramCount} OR
      name_subtitle ILIKE $${paramCount} OR
      keywords ILIKE $${paramCount}
    )`;
    params.push(`%${search}%`);
  }

  queryText += ' ORDER BY name ASC';

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Get a product type by ID
 * 
 * @param {number} id - Product type ID
 * @returns {Promise<Object|null>} Product type or null if not found
 */
ProductType.findById = async (id) => {
  const queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition,
      shelf_life_source,
      created_at,
      updated_at
    FROM product_types
    WHERE id = $1
  `;

  const result = await query(queryText, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Get product type by name (exact match)
 * 
 * @param {string} name - Product type name
 * @returns {Promise<Object|null>} Product type or null if not found
 */
ProductType.findByName = async (name) => {
  const queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition,
      shelf_life_source,
      created_at,
      updated_at
    FROM product_types
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
  `;

  const result = await query(queryText, [name]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Search product types by keywords
 * Uses PostgreSQL full-text search
 * 
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum results (default: 20)
 * @returns {Promise<Array>} Matching product types
 */
ProductType.search = async (searchTerm, limit = 20) => {
  const queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition,
      ts_rank(to_tsvector('english', keywords), to_tsquery('english', $1)) AS rank
    FROM product_types
    WHERE to_tsvector('english', keywords) @@ to_tsquery('english', $1)
      OR name ILIKE $2
      OR keywords ILIKE $2
    ORDER BY rank DESC, name ASC
    LIMIT $3
  `;

  // Convert search term to tsquery format (replace spaces with &)
  const tsquery = searchTerm.trim().split(/\s+/).join(' & ');
  const likePattern = `%${searchTerm}%`;

  const result = await query(queryText, [tsquery, likePattern, limit]);
  return result.rows;
};

/**
 * Get product types by category
 * 
 * @param {number} category_id - Category ID
 * @returns {Promise<Array>} Product types in category
 */
ProductType.findByCategory = async (category_id) => {
  const queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition,
      shelf_life_source,
      created_at,
      updated_at
    FROM product_types
    WHERE category_id = $1
    ORDER BY name ASC
  `;

  const result = await query(queryText, [category_id]);
  return result.rows;
};

/**
 * Get all unique categories
 * 
 * @returns {Promise<Array>} Categories with counts
 */
ProductType.getCategories = async () => {
  const queryText = `
    SELECT 
      category_id,
      COUNT(*) AS product_count
    FROM product_types
    WHERE category_id IS NOT NULL
    GROUP BY category_id
    ORDER BY category_id ASC
  `;

  const result = await query(queryText);
  return result.rows;
};

/**
 * Get shelf life for a specific product type and storage condition
 * 
 * @param {number} product_type_id - Product type ID
 * @param {string} storage_condition - Storage condition
 * @returns {Promise<number>} Shelf life in days
 */
ProductType.getShelfLife = async (product_type_id, storage_condition = null) => {
  const productType = await ProductType.findById(product_type_id);

  if (!productType) {
    throw new Error(`Product type ${product_type_id} not found`);
  }

  // If no storage condition specified, use default
  if (!storage_condition) {
    return productType.default_shelf_life_days;
  }

  // Check if shelf_life_source has specific data for this storage condition
  if (productType.shelf_life_source && productType.shelf_life_source[storage_condition]) {
    return productType.shelf_life_source[storage_condition];
  }

  // Fallback to default
  return productType.default_shelf_life_days;
};

/**
 * Batch get product types by IDs
 * 
 * @param {Array<number>} ids - Product type IDs
 * @returns {Promise<Array>} Product types
 */
ProductType.findByIds = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');

  const queryText = `
    SELECT 
      id,
      name,
      name_subtitle,
      category_id,
      keywords,
      default_shelf_life_days,
      default_storage_condition,
      shelf_life_source,
      created_at,
      updated_at
    FROM product_types
    WHERE id IN (${placeholders})
    ORDER BY name ASC
  `;

  const result = await query(queryText, ids);
  return result.rows;
};

module.exports = ProductType;
