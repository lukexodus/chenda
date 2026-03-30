const express = require('express');
const { body, query } = require('express-validator');
const {
  isAuthenticated,
  isSeller,
  isRider,
} = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const { uploadProofPhoto } = require('../middleware/uploadProofPhoto');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

const validateAssignRider = [
  body('rider_id').isInt({ min: 1 }).withMessage('rider_id must be a positive integer'),
  body('eta_at').optional().isISO8601().withMessage('eta_at must be a valid ISO date-time'),
];

const validateDispatchThirdParty = [
  body('provider').isString().isLength({ min: 2, max: 100 }).withMessage('provider is required'),
  body('tracking_reference').isString().isLength({ min: 2, max: 255 }).withMessage('tracking_reference is required'),
  body('eta_at').optional().isISO8601().withMessage('eta_at must be a valid ISO date-time'),
];

const validateRiderStatus = [
  body('status')
    .isIn(['accepted', 'picked_up', 'in_transit', 'delivered', 'failed'])
    .withMessage('status must be accepted, picked_up, in_transit, delivered, or failed'),
  body('eta_at').optional().isISO8601().withMessage('eta_at must be a valid ISO date-time'),
  body('failure_reason').optional().isString().isLength({ min: 3, max: 255 }).withMessage('failure_reason must be 3 to 255 chars'),
  body('note').optional().isString().isLength({ max: 255 }).withMessage('note max is 255 chars'),
];

const validateLocationUpdate = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be valid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be valid longitude'),
  body('source').optional().isIn(['manual', 'auto']).withMessage('source must be manual or auto'),
];

const validateAvailability = [
  body('is_available').isBoolean().withMessage('is_available must be boolean'),
];

const validateSlaQuery = [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('days must be 1..365'),
];

/** Seller dispatch endpoints */
router.post('/orders/:orderId/assign-in-house', isAuthenticated, isSeller, validateAssignRider, asyncHandler(deliveryController.assignInHouseRider));
router.post('/orders/:orderId/dispatch-third-party', isAuthenticated, isSeller, validateDispatchThirdParty, asyncHandler(deliveryController.dispatchThirdParty));
router.put('/:id/reassign', isAuthenticated, isSeller, validateAssignRider, asyncHandler(deliveryController.reassignRider));
router.get('/dispatch/active', isAuthenticated, isSeller, asyncHandler(deliveryController.listDispatchActive));
router.get('/dispatch/riders/available', isAuthenticated, isSeller, asyncHandler(deliveryController.listAvailableRiders));
router.get('/dispatch/sla/metrics', isAuthenticated, isSeller, validateSlaQuery, asyncHandler(deliveryController.getSlaMetrics));

/** Rider endpoints */
router.get('/rider/dashboard', isAuthenticated, isRider, asyncHandler(deliveryController.getRiderDashboard));
router.put('/rider/availability', isAuthenticated, isRider, validateAvailability, asyncHandler(deliveryController.setRiderAvailability));
router.get('/rider/jobs/available', isAuthenticated, isRider, asyncHandler(deliveryController.listAvailableJobs));
router.get('/rider/history', isAuthenticated, isRider, asyncHandler(deliveryController.getRiderHistory));
router.get('/rider/:id', isAuthenticated, isRider, asyncHandler(deliveryController.getRiderDeliveryDetail));
router.post('/:id/accept', isAuthenticated, isRider, asyncHandler(deliveryController.acceptDelivery));
router.post('/:id/decline', isAuthenticated, isRider, asyncHandler(deliveryController.declineDelivery));
router.put('/:id/status', isAuthenticated, isRider, validateRiderStatus, asyncHandler(deliveryController.updateRiderStatus));
router.post('/:id/location', isAuthenticated, isRider, validateLocationUpdate, asyncHandler(deliveryController.updateRiderLocation));
router.post('/:id/proof-photo', isAuthenticated, isRider, uploadProofPhoto, asyncHandler(deliveryController.uploadProofPhoto));

/** Buyer/seller tracking */
router.get('/orders/:orderId/tracking', isAuthenticated, asyncHandler(deliveryController.getOrderTracking));
router.post('/orders/:orderId/issues', isAuthenticated, asyncHandler(deliveryController.reportDeliveryIssue));

/** In-app notifications */
router.get('/notifications/me', isAuthenticated, asyncHandler(deliveryController.getMyNotifications));
router.get('/notifications/me/unread-count', isAuthenticated, asyncHandler(deliveryController.getMyNotificationUnreadCount));
router.post('/notifications/:notificationId/read', isAuthenticated, asyncHandler(deliveryController.markNotificationRead));
router.post('/notifications/me/read-all', isAuthenticated, asyncHandler(deliveryController.markAllNotificationsRead));

module.exports = router;
