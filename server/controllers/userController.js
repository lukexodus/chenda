const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { geocodeAddress, reverseGeocode } = require('../services/geocodingService');

/**
 * User Controller
 * Handles user profile, preferences, and location management
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const user = await User.findById(userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({
    success: true,
    data: user
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (name, email, type)
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, email, type } = req.body;
  
  // Build updates object
  const updates = {};
  
  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      res.status(400);
      throw new Error('Name cannot be empty');
    }
    updates.name = name.trim();
  }
  
  if (email !== undefined) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      res.status(400);
      throw new Error('Email is already taken');
    }
    
    updates.email = email.toLowerCase();
  }
  
  if (type !== undefined) {
    const validTypes = ['buyer', 'seller', 'both'];
    if (!validTypes.includes(type)) {
      res.status(400);
      throw new Error('User type must be buyer, seller, or both');
    }
    updates.type = type;
  }
  
  // If no updates provided
  if (Object.keys(updates).length === 0) {
    res.status(400);
    throw new Error('No updates provided');
  }
  
  // Update user
  const updatedUser = await User.update(userId, updates);
  
  if (!updatedUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user's algorithm preferences
 * @access  Private
 */
exports.updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const preferences = req.body;
  
  // Validate preferences object
  if (!preferences || typeof preferences !== 'object') {
    res.status(400);
    throw new Error('Preferences must be an object');
  }
  
  // Validate weights (if provided)
  if (preferences.proximity_weight !== undefined || preferences.freshness_weight !== undefined) {
    const proximityWeight = preferences.proximity_weight ?? 0;
    const freshnessWeight = preferences.freshness_weight ?? 0;
    
    // Validate weight types
    if (typeof proximityWeight !== 'number' || typeof freshnessWeight !== 'number') {
      res.status(400);
      throw new Error('Weights must be numbers');
    }
    
    // Validate weight ranges (0-100)
    if (proximityWeight < 0 || proximityWeight > 100 || freshnessWeight < 0 || freshnessWeight > 100) {
      res.status(400);
      throw new Error('Weights must be between 0 and 100');
    }
    
    // Validate weights sum to 100
    if (Math.abs((proximityWeight + freshnessWeight) - 100) > 0.01) {
      res.status(400);
      throw new Error('Proximity weight and freshness weight must sum to 100');
    }
  }
  
  // Validate max_radius (if provided)
  if (preferences.max_radius !== undefined) {
    if (typeof preferences.max_radius !== 'number' || preferences.max_radius <= 0) {
      res.status(400);
      throw new Error('Max radius must be a positive number');
    }
    if (preferences.max_radius > 500) {
      res.status(400);
      throw new Error('Max radius cannot exceed 500 km');
    }
  }
  
  // Validate min_freshness (if provided)
  if (preferences.min_freshness !== undefined) {
    if (typeof preferences.min_freshness !== 'number' || preferences.min_freshness < 0 || preferences.min_freshness > 100) {
      res.status(400);
      throw new Error('Min freshness must be between 0 and 100');
    }
  }
  
  // Validate mode (if provided)
  if (preferences.mode !== undefined) {
    const validModes = ['ranking', 'filter'];
    if (!validModes.includes(preferences.mode)) {
      res.status(400);
      throw new Error('Mode must be either "ranking" or "filter"');
    }
  }
  
  // Validate sort_by (if provided)
  if (preferences.sort_by !== undefined) {
    const validSortOptions = ['score', 'price', 'distance', 'freshness'];
    if (!validSortOptions.includes(preferences.sort_by)) {
      res.status(400);
      throw new Error('Sort by must be one of: score, price, distance, freshness');
    }
  }
  
  // Validate sort_order (if provided)
  if (preferences.sort_order !== undefined) {
    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(preferences.sort_order)) {
      res.status(400);
      throw new Error('Sort order must be either "asc" or "desc"');
    }
  }
  
  // Validate storage_conditions (if provided)
  if (preferences.storage_conditions !== undefined) {
    if (!Array.isArray(preferences.storage_conditions)) {
      res.status(400);
      throw new Error('Storage conditions must be an array');
    }
    
    const validConditions = [
      'pantry',
      'refrigerated_unopened',
      'refrigerated_opened',
      'frozen'
    ];
    
    for (const condition of preferences.storage_conditions) {
      if (!validConditions.includes(condition)) {
        res.status(400);
        throw new Error(`Invalid storage condition: ${condition}`);
      }
    }
  }
  
  // Update preferences
  const updatedUser = await User.updatePreferences(userId, preferences);
  
  if (!updatedUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: updatedUser.preferences
    }
  });
});

/**
 * @route   PUT /api/users/location
 * @desc    Update user's location
 * @access  Private
 */
exports.updateLocation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { lat, lng, address } = req.body;
  
  // Validate input - both coordinates or address required
  if ((!lat && !lng) && !address) {
    res.status(400);
    throw new Error('Either coordinates (lat, lng) or address is required');
  }
  
  let location = null;
  let finalAddress = null;
  
  // If coordinates provided
  if (lat !== undefined && lng !== undefined) {
    // Validate coordinate types
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400);
      throw new Error('Latitude and longitude must be numbers');
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      res.status(400);
      throw new Error('Latitude must be between -90 and 90');
    }
    
    if (lng < -180 || lng > 180) {
      res.status(400);
      throw new Error('Longitude must be between -180 and 180');
    }
    
    location = { lat, lng };
    
    // If address not provided, try reverse geocoding
    if (!address) {
      try {
        const geocodeResult = await reverseGeocode(lat, lng);
        finalAddress = geocodeResult.display_name;
      } catch (error) {
        // If reverse geocoding fails, leave address as null
        console.error('Reverse geocoding failed:', error.message);
      }
    } else {
      finalAddress = address;
    }
  }
  // If only address provided
  else if (address) {
    try {
      const geocodeResult = await geocodeAddress(address);
      location = {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng
      };
      finalAddress = geocodeResult.display_name;
    } catch (error) {
      res.status(400);
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }
  
  // Update user location
  const updatedUser = await User.updateLocation(userId, location, finalAddress);
  
  if (!updatedUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location: location,
      address: finalAddress
    }
  });
});

/**
 * @route   POST /api/users/geocode
 * @desc    Geocode an address to coordinates
 * @access  Private
 */
exports.geocode = asyncHandler(async (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    res.status(400);
    throw new Error('Address is required');
  }
  
  try {
    const result = await geocodeAddress(address);
    
    res.json({
      success: true,
      data: {
        lat: result.lat,
        lng: result.lng,
        address: result.display_name,
        address_details: result.address_details,
        cached: result.cached
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @route   POST /api/users/reverse-geocode
 * @desc    Reverse geocode coordinates to address
 * @access  Private
 */
exports.reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  
  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }
  
  try {
    const result = await reverseGeocode(lat, lng);
    
    res.json({
      success: true,
      data: {
        address: result.display_name,
        address_details: result.address_details,
        cached: result.cached
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
