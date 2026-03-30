/**
 * Delivery Controller
 * Dispatch, rider workflow, buyer/seller tracking, notifications, and SLA metrics.
 */

const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const deliveryNotificationService = require('../services/deliveryNotificationService');

const ALLOWED_RIDER_STATUS_UPDATES = new Set([
  'accepted',
  'picked_up',
  'in_transit',
  'delivered',
  'failed',
]);

const parseId = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildTrackingMessage = (status) => {
  const map = {
    assigned: 'Rider assigned to your order.',
    accepted: 'Rider accepted the delivery job.',
    picked_up: 'Order has been picked up by rider.',
    in_transit: 'Order is now in transit.',
    near_destination: 'Rider is near the destination.',
    delivered: 'Order has been delivered.',
    failed: 'Delivery failed. Please check updates.',
    declined: 'Rider declined this delivery assignment.',
  };

  return map[status] || `Delivery status changed to ${status}.`;
};

const notifyDeliveryUsers = async ({ deliveryId, userIds, eventType, title, message, metadata = {} }) => {
  await Delivery.notifyUsers({
    deliveryId,
    userIds,
    eventType,
    title,
    message,
  });

  await deliveryNotificationService.sendDeliveryEventNotifications({
    userIds,
    eventType,
    title,
    message,
    metadata,
  });
};

exports.assignInHouseRider = async (req, res) => {
  const orderId = parseId(req.params.orderId);
  const sellerId = req.user.id;
  const { rider_id: riderIdRaw, eta_at: etaAtRaw } = req.body;
  const riderId = parseId(riderIdRaw);

  if (!orderId || !riderId) {
    return res.status(400).json({
      success: false,
      message: 'orderId and rider_id must be valid integers',
    });
  }

  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.seller_id !== sellerId) {
    return res.status(403).json({ success: false, message: 'Only order seller can assign riders' });
  }

  const rider = await User.findById(riderId);
  if (!rider || rider.type !== 'rider') {
    return res.status(400).json({ success: false, message: 'Selected rider is invalid' });
  }

  const riderProfile = await Delivery.getRiderProfile(riderId);
  if (!riderProfile?.is_available) {
    return res.status(400).json({ success: false, message: 'Rider is currently unavailable' });
  }

  const etaAt = etaAtRaw ? new Date(etaAtRaw).toISOString() : null;

  const delivery = await Delivery.createForOrder({
    orderId,
    sellerId,
    buyerId: order.buyer_id,
    fulfillmentType: 'in_house',
    assignedRiderId: riderId,
    assignedBy: sellerId,
    etaAt,
    buyerAddressSnapshot: order.delivery_address,
    sellerAddressSnapshot: order.seller_name ? `${order.seller_name}` : null,
    initialStatus: 'assigned',
  });

  await Delivery.addEvent({
    deliveryId: delivery.id,
    actorUserId: sellerId,
    eventType: 'delivery_assigned',
    eventNote: `Assigned rider ${rider.name}`,
    metadata: { rider_id: riderId, eta_at: etaAt },
  });

  await notifyDeliveryUsers({
    deliveryId: delivery.id,
    userIds: [order.buyer_id, riderId],
    eventType: 'delivery_assigned',
    title: 'Delivery Update',
    message: buildTrackingMessage('assigned'),
    metadata: { order_id: order.id, delivery_id: delivery.id },
  });

  return res.status(201).json({
    success: true,
    message: 'Rider assigned successfully',
    delivery: await Delivery.getById(delivery.id),
  });
};

exports.dispatchThirdParty = async (req, res) => {
  const orderId = parseId(req.params.orderId);
  const sellerId = req.user.id;
  const {
    provider,
    tracking_reference: trackingReference,
    eta_at: etaAtRaw,
  } = req.body;

  if (!orderId || !provider || !trackingReference) {
    return res.status(400).json({
      success: false,
      message: 'orderId, provider, and tracking_reference are required',
    });
  }

  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.seller_id !== sellerId) {
    return res.status(403).json({ success: false, message: 'Only order seller can dispatch third-party courier' });
  }

  const etaAt = etaAtRaw ? new Date(etaAtRaw).toISOString() : null;

  const delivery = await Delivery.createForOrder({
    orderId,
    sellerId,
    buyerId: order.buyer_id,
    fulfillmentType: 'third_party',
    thirdPartyProvider: provider,
    thirdPartyTrackingRef: trackingReference,
    assignedBy: sellerId,
    etaAt,
    buyerAddressSnapshot: order.delivery_address,
    sellerAddressSnapshot: order.seller_name ? `${order.seller_name}` : null,
    initialStatus: 'in_transit',
  });

  await Delivery.addEvent({
    deliveryId: delivery.id,
    actorUserId: sellerId,
    eventType: 'delivery_dispatched_third_party',
    eventNote: `Dispatched to ${provider}`,
    metadata: {
      provider,
      tracking_reference: trackingReference,
      eta_at: etaAt,
    },
  });

  await notifyDeliveryUsers({
    deliveryId: delivery.id,
    userIds: [order.buyer_id],
    eventType: 'delivery_in_transit',
    title: 'Delivery Update',
    message: 'Your order has been dispatched to a third-party courier.',
    metadata: { order_id: order.id, delivery_id: delivery.id, provider },
  });

  return res.status(201).json({
    success: true,
    message: 'Third-party courier dispatched successfully',
    delivery: await Delivery.getById(delivery.id),
  });
};

exports.reassignRider = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const sellerId = req.user.id;
  const { rider_id: riderIdRaw, eta_at: etaAtRaw } = req.body;
  const riderId = parseId(riderIdRaw);

  if (!deliveryId || !riderId) {
    return res.status(400).json({ success: false, message: 'delivery id and rider_id are required' });
  }

  const existing = await Delivery.getById(deliveryId);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (existing.seller_id !== sellerId) {
    return res.status(403).json({ success: false, message: 'Only delivery seller can reassign rider' });
  }

  const rider = await User.findById(riderId);
  if (!rider || rider.type !== 'rider') {
    return res.status(400).json({ success: false, message: 'Selected rider is invalid' });
  }

  const etaAt = etaAtRaw ? new Date(etaAtRaw).toISOString() : null;
  const updated = await Delivery.updateAssignment({
    deliveryId,
    riderId,
    assignedBy: sellerId,
    etaAt,
  });

  await Delivery.addEvent({
    deliveryId,
    actorUserId: sellerId,
    eventType: 'delivery_reassigned',
    eventNote: `Reassigned to rider ${rider.name}`,
    metadata: { rider_id: riderId, eta_at: etaAt },
  });

  await notifyDeliveryUsers({
    deliveryId,
    userIds: [existing.buyer_id, riderId],
    eventType: 'delivery_assigned',
    title: 'Delivery Update',
    message: 'Rider has been assigned/reassigned to your order.',
    metadata: { delivery_id: deliveryId, rider_id: riderId },
  });

  return res.json({
    success: true,
    message: 'Delivery reassigned successfully',
    delivery: await Delivery.getById(updated.id),
  });
};

exports.listDispatchActive = async (req, res) => {
  const sellerId = req.user.id;
  const { status = null, limit = 50, offset = 0 } = req.query;

  const rows = await Delivery.listDispatchDeliveries({ sellerId, status, limit, offset });

  return res.json({
    success: true,
    deliveries: rows,
  });
};

exports.listAvailableRiders = async (req, res) => {
  const { limit = 100 } = req.query;
  const riders = await Delivery.listAvailableRiders({ limit });

  return res.json({
    success: true,
    riders,
  });
};

exports.getSlaMetrics = async (req, res) => {
  const sellerId = req.user.id;
  const { days = 30 } = req.query;

  const metrics = await Delivery.getSlaMetrics({
    sellerId,
    days,
    graceMinutes: 10,
  });

  return res.json({
    success: true,
    metrics,
  });
};

exports.getRiderDashboard = async (req, res) => {
  const riderId = req.user.id;
  const dashboard = await Delivery.getRiderDashboard(riderId);

  return res.json({
    success: true,
    dashboard,
  });
};

exports.setRiderAvailability = async (req, res) => {
  const riderId = req.user.id;
  const { is_available: isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'is_available must be a boolean',
    });
  }

  const profile = await Delivery.setRiderAvailability(riderId, isAvailable);

  return res.json({
    success: true,
    profile,
  });
};

exports.listAvailableJobs = async (req, res) => {
  const { limit = 30 } = req.query;
  const jobs = await Delivery.listAvailableJobs({ limit });

  return res.json({
    success: true,
    jobs,
  });
};

exports.acceptDelivery = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const riderId = req.user.id;

  if (!deliveryId) {
    return res.status(400).json({ success: false, message: 'delivery id is required' });
  }

  const delivery = await Delivery.getById(deliveryId);
  if (!delivery) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (delivery.fulfillment_type !== 'in_house') {
    return res.status(400).json({ success: false, message: 'Only in-house deliveries can be accepted by riders' });
  }

  if (delivery.assigned_rider_id && delivery.assigned_rider_id !== riderId) {
    return res.status(403).json({ success: false, message: 'Delivery is assigned to a different rider' });
  }

  if (!delivery.assigned_rider_id && delivery.status === 'available') {
    await Delivery.updateAssignment({
      deliveryId,
      riderId,
      assignedBy: riderId,
      etaAt: delivery.eta_at,
    });
  }

  const updated = await Delivery.updateStatus({
    deliveryId,
    riderId,
    status: 'accepted',
  });

  if (!updated) {
    return res.status(400).json({ success: false, message: 'Unable to accept this delivery' });
  }

  await notifyDeliveryUsers({
    deliveryId,
    userIds: [updated.buyer_id, updated.seller_id],
    eventType: 'delivery_accepted',
    title: 'Delivery Update',
    message: buildTrackingMessage('accepted'),
    metadata: { delivery_id: deliveryId, order_id: updated.order_id },
  });

  return res.json({
    success: true,
    message: 'Delivery accepted',
    delivery: await Delivery.getById(deliveryId),
  });
};

exports.declineDelivery = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const riderId = req.user.id;

  if (!deliveryId) {
    return res.status(400).json({ success: false, message: 'delivery id is required' });
  }

  const delivery = await Delivery.getById(deliveryId);
  if (!delivery) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (delivery.assigned_rider_id !== riderId) {
    return res.status(403).json({ success: false, message: 'Delivery is not assigned to current rider' });
  }

  const updated = await Delivery.updateStatus({
    deliveryId,
    riderId,
    status: 'declined',
    note: 'Rider declined assignment',
  });

  if (!updated) {
    return res.status(400).json({ success: false, message: 'Unable to decline this delivery' });
  }

  await notifyDeliveryUsers({
    deliveryId,
    userIds: [updated.seller_id],
    eventType: 'delivery_declined',
    title: 'Delivery Update',
    message: buildTrackingMessage('declined'),
    metadata: { delivery_id: deliveryId, order_id: updated.order_id },
  });

  return res.json({
    success: true,
    message: 'Delivery declined',
    delivery: await Delivery.getById(deliveryId),
  });
};

exports.updateRiderStatus = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const riderId = req.user.id;
  const { status, eta_at: etaAtRaw, note = null, failure_reason: failureReason = null } = req.body;

  if (!deliveryId || !status || !ALLOWED_RIDER_STATUS_UPDATES.has(status)) {
    return res.status(400).json({
      success: false,
      message: 'delivery id and valid status are required',
    });
  }

  if (status === 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'Use proof photo upload endpoint to mark delivery as delivered',
    });
  }

  const etaAt = etaAtRaw ? new Date(etaAtRaw).toISOString() : null;

  const updated = await Delivery.updateStatus({
    deliveryId,
    riderId,
    status,
    note,
    etaAt,
    failureReason,
  });

  if (!updated) {
    return res.status(400).json({
      success: false,
      message: 'Unable to update delivery status',
    });
  }

  await notifyDeliveryUsers({
    deliveryId,
    userIds: [updated.buyer_id, updated.seller_id],
    eventType: `delivery_${status}`,
    title: 'Delivery Update',
    message: buildTrackingMessage(status),
    metadata: { delivery_id: deliveryId, order_id: updated.order_id, status },
  });

  return res.json({
    success: true,
    message: 'Delivery status updated',
    delivery: await Delivery.getById(deliveryId),
  });
};

exports.updateRiderLocation = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const riderId = req.user.id;
  const { lat, lng, source = 'manual' } = req.body;

  if (!deliveryId || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return res.status(400).json({
      success: false,
      message: 'delivery id, lat and lng are required',
    });
  }

  const delivery = await Delivery.getById(deliveryId);
  if (!delivery) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (delivery.assigned_rider_id !== riderId) {
    return res.status(403).json({ success: false, message: 'Delivery is not assigned to current rider' });
  }

  const update = await Delivery.addLocationUpdate({
    deliveryId,
    riderId,
    lat: Number(lat),
    lng: Number(lng),
    source,
  });

  const nearDestinationThresholdMeters = Math.max(
    Number(process.env.DELIVERY_NEAR_DESTINATION_METERS || 300),
    50
  );

  if (['picked_up', 'in_transit'].includes(delivery.status)) {
    const distanceMeters = await Delivery.getDistanceToBuyerMeters({
      deliveryId,
      lat: Number(lat),
      lng: Number(lng),
    });

    if (distanceMeters !== null && distanceMeters <= nearDestinationThresholdMeters) {
      const alreadySent = await Delivery.hasEvent({
        deliveryId,
        eventType: 'delivery_near_destination',
      });

      if (!alreadySent) {
        await Delivery.addEvent({
          deliveryId,
          actorUserId: riderId,
          eventType: 'delivery_near_destination',
          eventNote: 'Rider is near destination',
          metadata: {
            distance_meters: Number(distanceMeters.toFixed(2)),
            threshold_meters: nearDestinationThresholdMeters,
            source,
          },
        });

        await notifyDeliveryUsers({
          deliveryId,
          userIds: [delivery.buyer_id, delivery.seller_id],
          eventType: 'delivery_near_destination',
          title: 'Delivery Update',
          message: buildTrackingMessage('near_destination'),
          metadata: {
            delivery_id: deliveryId,
            order_id: delivery.order_id,
            distance_meters: Number(distanceMeters.toFixed(2)),
          },
        });
      }
    }
  }

  return res.status(201).json({
    success: true,
    message: 'Rider location updated',
    locationUpdate: update,
  });
};

exports.uploadProofPhoto = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const riderId = req.user.id;

  if (!deliveryId) {
    return res.status(400).json({ success: false, message: 'delivery id is required' });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'proof_photo image is required',
    });
  }

  const proofPhotoUrl = `/uploads/delivery-proofs/${req.file.filename}`;
  const updated = await Delivery.addProofPhoto({
    deliveryId,
    riderId,
    proofPhotoUrl,
  });

  if (!updated) {
    return res.status(400).json({
      success: false,
      message: 'Unable to upload proof photo for this delivery',
    });
  }

  await notifyDeliveryUsers({
    deliveryId,
    userIds: [updated.buyer_id, updated.seller_id],
    eventType: 'delivery_delivered',
    title: 'Delivery Update',
    message: buildTrackingMessage('delivered'),
    metadata: { delivery_id: deliveryId, order_id: updated.order_id },
  });

  return res.status(201).json({
    success: true,
    message: 'Proof photo uploaded and delivery marked as delivered',
    delivery: await Delivery.getById(deliveryId),
  });
};

exports.getRiderDeliveryDetail = async (req, res) => {
  const deliveryId = parseId(req.params.id);
  const riderId = req.user.id;

  if (!deliveryId) {
    return res.status(400).json({ success: false, message: 'delivery id is required' });
  }

  const delivery = await Delivery.getById(deliveryId);
  if (!delivery) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (delivery.assigned_rider_id !== riderId) {
    return res.status(403).json({ success: false, message: 'Delivery is not assigned to current rider' });
  }

  const tracking = await Delivery.getTrackingByOrder({ orderId: delivery.order_id });

  return res.json({
    success: true,
    delivery,
    timeline: tracking?.timeline || [],
  });
};

exports.getRiderHistory = async (req, res) => {
  const riderId = req.user.id;
  const { limit = 100 } = req.query;

  const history = await Delivery.getRiderEarningsHistory({ riderId, limit });

  return res.json({
    success: true,
    history,
  });
};

exports.getOrderTracking = async (req, res) => {
  const orderId = parseId(req.params.orderId);
  const userId = req.user.id;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'order id is required' });
  }

  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const isAuthorized = order.buyer_id === userId || order.seller_id === userId;
  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const tracking = await Delivery.getTrackingByOrder({ orderId });
  if (!tracking) {
    return res.status(404).json({
      success: false,
      message: 'Delivery tracking not available for this order yet',
    });
  }

  return res.json({
    success: true,
    tracking,
  });
};

exports.reportDeliveryIssue = async (req, res) => {
  const orderId = parseId(req.params.orderId);
  const userId = req.user.id;
  const { message } = req.body;

  if (!orderId || !message || String(message).trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'order id and issue message (min 5 chars) are required',
    });
  }

  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.buyer_id !== userId && order.seller_id !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const delivery = await Delivery.getByOrderId(orderId);
  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'No delivery record found for this order',
    });
  }

  await Delivery.addEvent({
    deliveryId: delivery.id,
    actorUserId: userId,
    eventType: 'delivery_issue_reported',
    eventNote: String(message).trim(),
    metadata: {
      reporter_id: userId,
      order_id: orderId,
    },
  });

  const recipients = [order.seller_id];
  if (delivery.assigned_rider_id) {
    recipients.push(delivery.assigned_rider_id);
  }

  await notifyDeliveryUsers({
    deliveryId: delivery.id,
    userIds: recipients,
    eventType: 'delivery_issue_reported',
    title: 'Delivery Issue Reported',
    message: String(message).trim(),
    metadata: { delivery_id: delivery.id, order_id: orderId },
  });

  return res.status(201).json({
    success: true,
    message: 'Delivery issue reported',
  });
};

exports.getMyNotifications = async (req, res) => {
  const userId = req.user.id;
  const { limit = 50 } = req.query;
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const result = await require('../config/database').query(
    `SELECT id, delivery_id, event_type, title, message, read_at, created_at
     FROM delivery_notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, safeLimit]
  );

  return res.json({
    success: true,
    notifications: result.rows,
  });
};

exports.getMyNotificationUnreadCount = async (req, res) => {
  const userId = req.user.id;

  const result = await require('../config/database').query(
    `SELECT COUNT(*)::int AS unread_count
     FROM delivery_notifications
     WHERE user_id = $1
       AND read_at IS NULL`,
    [userId]
  );

  return res.json({
    success: true,
    unread_count: result.rows[0]?.unread_count || 0,
  });
};

exports.markNotificationRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = parseId(req.params.notificationId);

  if (!notificationId) {
    return res.status(400).json({ success: false, message: 'notification id is required' });
  }

  const result = await require('../config/database').query(
    `UPDATE delivery_notifications
     SET read_at = NOW()
     WHERE id = $1
       AND user_id = $2
     RETURNING id, delivery_id, event_type, title, message, read_at, created_at`,
    [notificationId, userId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  return res.json({
    success: true,
    notification: result.rows[0],
  });
};

exports.markAllNotificationsRead = async (req, res) => {
  const userId = req.user.id;

  const result = await require('../config/database').query(
    `UPDATE delivery_notifications
     SET read_at = NOW()
     WHERE user_id = $1
       AND read_at IS NULL`,
    [userId]
  );

  return res.json({
    success: true,
    updated: result.rowCount || 0,
  });
};
