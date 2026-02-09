/**
 * Authentication Middleware
 * Protects routes and checks user permissions
 */

/**
 * Check if user is authenticated
 * Use this middleware to protect routes that require login
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    message: 'Authentication required. Please login.',
  });
};

/**
 * Check if user is a buyer
 * User must have type 'buyer' or 'both'
 */
const isBuyer = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.',
    });
  }

  if (req.user.type === 'buyer' || req.user.type === 'both') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied. Buyer privileges required.',
  });
};

/**
 * Check if user is a seller
 * User must have type 'seller' or 'both'
 */
const isSeller = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.',
    });
  }

  if (req.user.type === 'seller' || req.user.type === 'both') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied. Seller privileges required.',
  });
};

/**
 * Check if user owns a resource
 * Compares req.user.id with resourceOwnerId from route params or body
 * 
 * Usage:
 * router.put('/products/:id', isAuthenticated, isOwner('seller_id'), updateProduct);
 */
const isOwner = (ownerField = 'user_id') => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    const ownerId = req.params[ownerField] || req.body[ownerField] || req.resource?.[ownerField];

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Resource owner information not found.',
      });
    }

    if (parseInt(ownerId) === req.user.id) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. You do not own this resource.',
    });
  };
};

module.exports = {
  isAuthenticated,
  isBuyer,
  isSeller,
  isOwner,
};
