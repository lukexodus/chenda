const axios = require('axios');
const NodeCache = require('node-cache');

/**
 * Geocoding Service
 * Integrates with Nominatim (OpenStreetMap) for geocoding
 * Includes rate limiting and caching to avoid duplicate requests
 */

// Cache geocoding results for 7 days (604800 seconds)
const geocodeCache = new NodeCache({ stdTTL: 604800, checkperiod: 86400 });

// Rate limiting: Nominatim requires 1 second between requests
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000; // 1 second

/**
 * Sleep function for rate limiting
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate-limited request to Nominatim
 * Ensures minimum 1 second between requests
 * @param {string} url - Request URL
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function rateLimitedRequest(url, params) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    await sleep(waitTime);
  }
  
  lastRequestTime = Date.now();
  
  const response = await axios.get(url, {
    params,
    headers: {
      'User-Agent': 'Chenda-App/1.0 (perishable-goods-platform)'
    }
  });
  
  return response.data;
}

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Geocoding result
 * @returns {Object.lat} Latitude
 * @returns {Object.lng} Longitude
 * @returns {Object.display_name} Formatted address
 * @throws {Error} If geocoding fails
 */
async function geocodeAddress(address) {
  // Input validation
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Address is required and must be a non-empty string');
  }

  const trimmedAddress = address.trim();
  
  // Check cache first
  const cacheKey = `geocode:${trimmedAddress.toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);
  
  if (cached) {
    return {
      ...cached,
      cached: true
    };
  }
  
  try {
    // Make request to Nominatim
    const data = await rateLimitedRequest('https://nominatim.openstreetmap.org/search', {
      q: trimmedAddress,
      format: 'json',
      limit: 1,
      addressdetails: 1
    });
    
    if (!data || data.length === 0) {
      throw new Error('Address not found. Please try a more specific address.');
    }
    
    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name,
      address_details: data[0].address || {}
    };
    
    // Cache the result
    geocodeCache.set(cacheKey, result);
    
    return {
      ...result,
      cached: false
    };
    
  } catch (error) {
    if (error.response) {
      // Nominatim API error
      throw new Error(`Geocoding service error: ${error.response.statusText}`);
    } else if (error.request) {
      // Network error
      throw new Error('Unable to reach geocoding service. Please try again later.');
    } else {
      // Other error
      throw error;
    }
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Reverse geocoding result
 * @returns {Object.display_name} Formatted address
 * @returns {Object.address_details} Detailed address components
 * @throws {Error} If reverse geocoding fails
 */
async function reverseGeocode(lat, lng) {
  // Input validation
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Latitude and longitude must be numbers');
  }
  
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  
  if (lng < -180 || lng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  
  // Check cache first
  const cacheKey = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = geocodeCache.get(cacheKey);
  
  if (cached) {
    return {
      ...cached,
      cached: true
    };
  }
  
  try {
    // Make request to Nominatim
    const data = await rateLimitedRequest('https://nominatim.openstreetmap.org/reverse', {
      lat,
      lon: lng,
      format: 'json',
      addressdetails: 1
    });
    
    if (!data || data.error) {
      throw new Error('Location not found');
    }
    
    const result = {
      display_name: data.display_name,
      address_details: data.address || {}
    };
    
    // Cache the result
    geocodeCache.set(cacheKey, result);
    
    return {
      ...result,
      cached: false
    };
    
  } catch (error) {
    if (error.response) {
      throw new Error(`Geocoding service error: ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Unable to reach geocoding service. Please try again later.');
    } else {
      throw error;
    }
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  return {
    keys: geocodeCache.keys().length,
    hits: geocodeCache.getStats().hits,
    misses: geocodeCache.getStats().misses,
    ksize: geocodeCache.getStats().ksize,
    vsize: geocodeCache.getStats().vsize
  };
}

/**
 * Clear geocoding cache
 * @returns {void}
 */
function clearCache() {
  geocodeCache.flushAll();
}

module.exports = {
  geocodeAddress,
  reverseGeocode,
  getCacheStats,
  clearCache
};
