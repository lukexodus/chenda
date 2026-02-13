const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/authenticate');

/**
 * User Management Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', isAuthenticated, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (name, email, type)
 * @access  Private
 */
router.put('/profile', isAuthenticated, userController.updateProfile);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user's algorithm preferences
 * @access  Private
 */
router.put('/preferences', isAuthenticated, userController.updatePreferences);

/**
 * @route   PUT /api/users/location
 * @desc    Update user's location (coordinates or address)
 * @access  Private
 */
router.put('/location', isAuthenticated, userController.updateLocation);

/**
 * @route   POST /api/users/geocode
 * @desc    Geocode an address to coordinates
 * @access  Private
 */
router.post('/geocode', isAuthenticated, userController.geocode);

/**
 * @route   POST /api/users/reverse-geocode
 * @desc    Reverse geocode coordinates to address
 * @access  Private
 */
router.post('/reverse-geocode', isAuthenticated, userController.reverseGeocode);

module.exports = router;
