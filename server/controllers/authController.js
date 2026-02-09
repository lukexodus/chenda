const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Authentication Controller
 * Handles user registration, login, logout, and session management
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, type, address, location } = req.body;

  // Validation
  if (!name || !email || !password || !type) {
    res.status(400);
    throw new Error('Please provide name, email, password, and user type');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // Validate password length
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long');
  }

  // Validate user type
  const validTypes = ['buyer', 'seller', 'both'];
  if (!validTypes.includes(type)) {
    res.status(400);
    throw new Error('User type must be buyer, seller, or both');
  }

  // Check if email already exists
  const emailExists = await User.emailExists(email);
  if (emailExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    type,
    address,
    location
  });

  // Auto-login after registration
  req.login(user, (err) => {
    if (err) {
      throw err;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        address: user.address,
        preferences: user.preferences,
        created_at: user.created_at,
      },
    });
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and create session
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Passport authentication is handled by middleware
  // This function is called after successful authentication
  res.json({
    success: true,
    message: 'Logged in successfully',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      type: req.user.type,
      address: req.user.address,
      preferences: req.user.preferences,
      created_at: req.user.created_at,
    },
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  req.logout((err) => {
    if (err) {
      throw err;
    }

    req.session.destroy((err) => {
      if (err) {
        throw err;
      }

      res.clearCookie('chenda.sid');
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      address: user.address,
      preferences: user.preferences,
      email_verified: user.email_verified,
      created_at: user.created_at,
    },
  });
});

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters long');
  }

  // Get user with password hash
  const user = await User.findByEmail(req.user.email);

  // Verify current password
  const isValid = await User.verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Update password
  await User.updatePassword(req.user.id, newPassword);

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
});
