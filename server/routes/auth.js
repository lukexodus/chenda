const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authenticate');

/**
 * Authentication Routes
 * Handles user registration, login, logout, and session management
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and create session
 * @access  Public
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || 'Authentication failed',
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      return authController.login(req, res, next);
    });
  })(req, res, next);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
router.post('/logout', isAuthenticated, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', isAuthenticated, authController.getMe);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/password', isAuthenticated, authController.updatePassword);

module.exports = router;
