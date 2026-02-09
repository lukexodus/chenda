const { query } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * User Model
 * Handles all database operations for users
 */
class User {
  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, type, address, preferences, email_verified, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object with password_hash or null
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT id, name, email, password_hash, type, address, preferences, email_verified, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password (will be hashed)
   * @param {string} userData.type - User type (buyer, seller, both)
   * @param {string} [userData.address] - User address (optional)
   * @param {Object} [userData.location] - User location coordinates (optional)
   * @returns {Promise<Object>} Created user object (without password)
   */
  static async create(userData) {
    const { name, email, password, type, address = null, location = null } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Default preferences based on user type
    const defaultPreferences = {
      proximity_weight: 60,
      shelf_life_weight: 40,
      max_radius_km: 50,
      min_freshness_percent: 0,
      display_mode: 'ranking',
      storage_conditions: ['refrigerated_unopened', 'refrigerated_opened', 'frozen', 'pantry']
    };

    const locationSQL = location 
      ? 'ST_SetSRID(ST_MakePoint($7, $8), 4326)'
      : 'NULL';

    const params = location
      ? [name, email, password_hash, type, address, JSON.stringify(defaultPreferences), location.lng, location.lat]
      : [name, email, password_hash, type, address, JSON.stringify(defaultPreferences)];

    const result = await query(
      `INSERT INTO users (
        name, email, password_hash, type, address, preferences, location, email_verified, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, ${locationSQL}, false, NOW()
      ) RETURNING id, name, email, type, address, preferences, email_verified, created_at`,
      params
    );

    return result.rows[0];
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user object
   */
  static async update(id, updates) {
    const allowedFields = ['name', 'address', 'type'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount}
       RETURNING id, name, email, type, address, preferences, email_verified, created_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Update user preferences
   * @param {number} id - User ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<Object>} Updated user object
   */
  static async updatePreferences(id, preferences) {
    const result = await query(
      `UPDATE users SET preferences = $1::jsonb, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, type, address, preferences, email_verified, created_at`,
      [JSON.stringify(preferences), id]
    );

    return result.rows[0];
  }

  /**
   * Update user location
   * @param {number} id - User ID
   * @param {Object} location - Location coordinates
   * @param {number} location.lat - Latitude
   * @param {number} location.lng - Longitude
   * @param {string} [address] - Address string (optional)
   * @returns {Promise<Object>} Updated user object
   */
  static async updateLocation(id, location, address = null) {
    const result = await query(
      `UPDATE users 
       SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           address = COALESCE($3, address),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, type, address, preferences, email_verified, created_at`,
      [location.lng, location.lat, address, id]
    );

    return result.rows[0];
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<boolean>} Success status
   */
  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, id]
    );

    return true;
  }

  /**
   * Verify password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  static async emailExists(email) {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    return result.rows.length > 0;
  }

  /**
   * Delete user (soft delete by setting status)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return true;
  }
}

module.exports = User;
