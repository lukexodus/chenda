/**
 * Delivery Model
 * Handles hybrid fulfillment, rider operations, tracking, notifications, and SLA metrics.
 */

const { query } = require('../config/database');

class Delivery {
  static async ensureRiderProfile(userId) {
    await query(
      `INSERT INTO rider_profiles (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  }

  static async getRiderProfile(userId) {
    await this.ensureRiderProfile(userId);

    const result = await query(
      `SELECT user_id, is_available, base_fee, percentage_rate
       FROM rider_profiles
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  static async setRiderAvailability(userId, isAvailable) {
    await this.ensureRiderProfile(userId);

    const result = await query(
      `UPDATE rider_profiles
       SET is_available = $2
       WHERE user_id = $1
       RETURNING user_id, is_available, base_fee, percentage_rate`,
      [userId, Boolean(isAvailable)]
    );

    return result.rows[0] || null;
  }

  static async listAvailableRiders({ limit = 100 }) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 300);

    const result = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         rp.is_available,
         rp.base_fee,
         rp.percentage_rate,
         (
           SELECT COUNT(*)::int
           FROM deliveries d
           WHERE d.assigned_rider_id = u.id
             AND d.status IN ('assigned', 'accepted', 'picked_up', 'in_transit')
         ) AS active_deliveries
       FROM users u
       LEFT JOIN rider_profiles rp ON rp.user_id = u.id
       WHERE u.type = 'rider'
       ORDER BY COALESCE(rp.is_available, true) DESC, u.name ASC
       LIMIT $1`,
      [safeLimit]
    );

    return result.rows;
  }

  static async getById(deliveryId) {
    const result = await query(
      `SELECT
         d.*,
         o.total_amount,
         o.payment_status,
         o.order_status,
         o.payment_method,
         o.product_id,
         o.delivery_notes,
         u_buyer.name AS buyer_name,
         u_seller.name AS seller_name,
         u_rider.name AS rider_name,
         pt.name AS product_name,
         lu.id AS latest_location_id,
         CASE WHEN lu.location IS NOT NULL THEN ST_Y(lu.location) END AS rider_lat,
         CASE WHEN lu.location IS NOT NULL THEN ST_X(lu.location) END AS rider_lng,
         lu.created_at AS rider_location_updated_at
       FROM deliveries d
       INNER JOIN orders o ON d.order_id = o.id
       INNER JOIN users u_buyer ON d.buyer_id = u_buyer.id
       INNER JOIN users u_seller ON d.seller_id = u_seller.id
       LEFT JOIN users u_rider ON d.assigned_rider_id = u_rider.id
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN product_types pt ON p.product_type_id = pt.id
       LEFT JOIN LATERAL (
         SELECT id, location, created_at
         FROM delivery_location_updates
         WHERE delivery_id = d.id
         ORDER BY created_at DESC
         LIMIT 1
       ) lu ON true
       WHERE d.id = $1`,
      [deliveryId]
    );

    const row = result.rows[0] || null;
    if (!row) {
      return null;
    }

    if (row.rider_lat !== null && row.rider_lng !== null) {
      row.rider_location = {
        lat: Number(row.rider_lat),
        lng: Number(row.rider_lng),
        updated_at: row.rider_location_updated_at,
      };
    }

    row.assigned_rider_name = row.rider_name || null;

    delete row.rider_lat;
    delete row.rider_lng;
    delete row.rider_location_updated_at;

    return row;
  }

  static async getByOrderId(orderId) {
    const result = await query(
      `SELECT id, order_id, seller_id, buyer_id, assigned_rider_id, fulfillment_type, status
       FROM deliveries
       WHERE order_id = $1`,
      [orderId]
    );

    return result.rows[0] || null;
  }

  static async createForOrder({
    orderId,
    sellerId,
    buyerId,
    fulfillmentType,
    thirdPartyProvider = null,
    thirdPartyTrackingRef = null,
    assignedRiderId = null,
    assignedBy = null,
    etaAt = null,
    buyerAddressSnapshot = null,
    sellerAddressSnapshot = null,
    initialStatus = null,
  }) {
    const status = initialStatus || (assignedRiderId ? 'assigned' : 'available');

    const result = await query(
      `INSERT INTO deliveries (
         order_id, seller_id, buyer_id,
         assigned_rider_id, assigned_by,
         fulfillment_type, third_party_provider, third_party_tracking_ref,
         status, eta_at, buyer_address_snapshot, seller_address_snapshot
       ) VALUES (
         $1, $2, $3,
         $4, $5,
         $6, $7, $8,
         $9, $10, $11, $12
       )
       ON CONFLICT (order_id)
       DO UPDATE SET
         assigned_rider_id = EXCLUDED.assigned_rider_id,
         assigned_by = EXCLUDED.assigned_by,
         fulfillment_type = EXCLUDED.fulfillment_type,
         third_party_provider = EXCLUDED.third_party_provider,
         third_party_tracking_ref = EXCLUDED.third_party_tracking_ref,
         status = EXCLUDED.status,
         eta_at = EXCLUDED.eta_at,
         buyer_address_snapshot = EXCLUDED.buyer_address_snapshot,
         seller_address_snapshot = EXCLUDED.seller_address_snapshot,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        orderId,
        sellerId,
        buyerId,
        assignedRiderId,
        assignedBy,
        fulfillmentType,
        thirdPartyProvider,
        thirdPartyTrackingRef,
        status,
        etaAt,
        buyerAddressSnapshot,
        sellerAddressSnapshot,
      ]
    );

    return result.rows[0];
  }

  static async listAvailableJobs({ limit = 30 }) {
    const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);

    const result = await query(
      `SELECT
         d.id,
         d.order_id,
         d.created_at,
         d.eta_at,
         d.buyer_address_snapshot,
         d.seller_address_snapshot,
         o.total_amount,
         o.payment_method,
         pt.name AS product_name,
         u_buyer.name AS buyer_name,
         u_seller.name AS seller_name
       FROM deliveries d
       INNER JOIN orders o ON d.order_id = o.id
       INNER JOIN users u_buyer ON d.buyer_id = u_buyer.id
       INNER JOIN users u_seller ON d.seller_id = u_seller.id
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN product_types pt ON p.product_type_id = pt.id
       WHERE d.fulfillment_type = 'in_house'
         AND d.status = 'available'
         AND d.assigned_rider_id IS NULL
       ORDER BY d.created_at ASC
       LIMIT $1`,
      [safeLimit]
    );

    return result.rows;
  }

  static async listDispatchDeliveries({ sellerId, status = null, limit = 50, offset = 0 }) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const params = [sellerId];
    let whereSql = 'WHERE d.seller_id = $1';

    if (status) {
      params.push(status);
      whereSql += ` AND d.status = $${params.length}`;
    }

    params.push(safeLimit);
    params.push(safeOffset);

    const result = await query(
      `SELECT
         d.id,
         d.order_id,
         d.status,
         d.fulfillment_type,
         d.assigned_rider_id,
         d.third_party_provider,
         d.third_party_tracking_ref,
         d.eta_at,
         d.created_at,
         u_rider.name AS rider_name,
         o.total_amount,
         u_buyer.name AS buyer_name
       FROM deliveries d
       INNER JOIN orders o ON d.order_id = o.id
       INNER JOIN users u_buyer ON d.buyer_id = u_buyer.id
       LEFT JOIN users u_rider ON d.assigned_rider_id = u_rider.id
       ${whereSql}
       ORDER BY d.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return result.rows;
  }

  static async listRiderDeliveries({ riderId, statuses = [], limit = 50 }) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const params = [riderId, safeLimit];

    let statusSql = '';
    if (statuses.length > 0) {
      params.push(statuses);
      statusSql = `AND d.status = ANY($3::text[])`;
    }

    const result = await query(
      `SELECT
         d.id,
         d.order_id,
         d.status,
         d.fulfillment_type,
         d.eta_at,
         d.created_at,
         d.delivered_at,
         d.buyer_address_snapshot,
         d.seller_address_snapshot,
         o.total_amount,
         pt.name AS product_name,
         u_buyer.name AS buyer_name,
         u_seller.name AS seller_name
       FROM deliveries d
       INNER JOIN orders o ON d.order_id = o.id
       INNER JOIN users u_buyer ON d.buyer_id = u_buyer.id
       INNER JOIN users u_seller ON d.seller_id = u_seller.id
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN product_types pt ON p.product_type_id = pt.id
       WHERE d.assigned_rider_id = $1
         ${statusSql}
       ORDER BY d.created_at DESC
       LIMIT $2`,
      params
    );

    return result.rows;
  }

  static async updateAssignment({ deliveryId, riderId, assignedBy, etaAt }) {
    const result = await query(
      `UPDATE deliveries
       SET assigned_rider_id = $2,
           assigned_by = $3,
           status = 'assigned',
           eta_at = $4,
           fulfillment_type = 'in_house',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [deliveryId, riderId, assignedBy, etaAt]
    );

    return result.rows[0] || null;
  }

  static async updateThirdPartyDispatch({ deliveryId, provider, trackingRef, assignedBy, etaAt }) {
    const result = await query(
      `UPDATE deliveries
       SET assigned_rider_id = NULL,
           assigned_by = $2,
           fulfillment_type = 'third_party',
           third_party_provider = $3,
           third_party_tracking_ref = $4,
           status = 'in_transit',
           eta_at = $5,
           in_transit_at = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [deliveryId, assignedBy, provider, trackingRef, etaAt]
    );

    return result.rows[0] || null;
  }

  static async updateStatus({ deliveryId, riderId = null, status, note = null, etaAt = null, failureReason = null }) {
    const timestampFields = {
      accepted: 'accepted_at',
      picked_up: 'picked_up_at',
      in_transit: 'in_transit_at',
      delivered: 'delivered_at',
      failed: 'failed_at',
    };

    const updates = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [deliveryId, status];
    let paramIndex = 3;

    if (etaAt) {
      updates.push(`eta_at = $${paramIndex}`);
      params.push(etaAt);
      paramIndex += 1;
    }

    if (failureReason) {
      updates.push(`failure_reason = $${paramIndex}`);
      params.push(failureReason);
      paramIndex += 1;
    }

    const tsField = timestampFields[status];
    if (tsField) {
      updates.push(`${tsField} = NOW()`);
    }

    const whereParts = ['id = $1'];
    if (riderId !== null) {
      whereParts.push(`assigned_rider_id = $${paramIndex}`);
      params.push(riderId);
      paramIndex += 1;
    }

    const result = await query(
      `UPDATE deliveries
       SET ${updates.join(', ')}
       WHERE ${whereParts.join(' AND ')}
       RETURNING *`,
      params
    );

    if (result.rows[0]) {
      await this.addEvent({
        deliveryId,
        actorUserId: riderId,
        eventType: `delivery_${status}`,
        eventNote: note,
        metadata: {
          eta_at: etaAt,
          failure_reason: failureReason,
        },
      });
    }

    return result.rows[0] || null;
  }

  static async addProofPhoto({ deliveryId, riderId, proofPhotoUrl }) {
    const result = await query(
      `UPDATE deliveries
       SET proof_photo_url = $3,
           status = 'delivered',
           delivered_at = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND assigned_rider_id = $2
       RETURNING *`,
      [deliveryId, riderId, proofPhotoUrl]
    );

    if (result.rows[0]) {
      await this.addEvent({
        deliveryId,
        actorUserId: riderId,
        eventType: 'delivery_proof_photo_uploaded',
        eventNote: 'Proof photo uploaded and delivery marked delivered',
      });
    }

    return result.rows[0] || null;
  }

  static async addLocationUpdate({ deliveryId, riderId, lat, lng, source = 'manual' }) {
    const result = await query(
      `INSERT INTO delivery_location_updates (delivery_id, rider_id, location, source)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)
       RETURNING id, delivery_id, rider_id, source, created_at`,
      [deliveryId, riderId, lng, lat, source]
    );

    return result.rows[0] || null;
  }

  static async getDistanceToBuyerMeters({ deliveryId, lat, lng }) {
    const result = await query(
      `SELECT
         ST_Distance(
           ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
           u.location::geography
         ) AS distance_meters
       FROM deliveries d
       INNER JOIN users u ON d.buyer_id = u.id
       WHERE d.id = $1
         AND u.location IS NOT NULL`,
      [deliveryId, lng, lat]
    );

    const value = result.rows[0]?.distance_meters;
    return value !== undefined && value !== null ? Number(value) : null;
  }

  static async hasEvent({ deliveryId, eventType }) {
    const result = await query(
      `SELECT 1
       FROM delivery_events
       WHERE delivery_id = $1
         AND event_type = $2
       LIMIT 1`,
      [deliveryId, eventType]
    );

    return Boolean(result.rows[0]);
  }

  static async addEvent({ deliveryId, actorUserId = null, eventType, eventNote = null, metadata = {} }) {
    const result = await query(
      `INSERT INTO delivery_events (delivery_id, actor_user_id, event_type, event_note, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [deliveryId, actorUserId, eventType, eventNote, metadata]
    );

    return result.rows[0] || null;
  }

  static async notifyUsers({ deliveryId, userIds, eventType, title, message }) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return;
    }

    await Promise.all(
      [...new Set(userIds)].map((userId) =>
        query(
          `INSERT INTO delivery_notifications (user_id, delivery_id, event_type, title, message)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, deliveryId, eventType, title, message]
        )
      )
    );
  }

  static async getTrackingByOrder({ orderId }) {
    const delivery = await this.getByOrderId(orderId);
    if (!delivery) {
      return null;
    }

    const full = await this.getById(delivery.id);

    const events = await query(
      `SELECT id, event_type, event_note, metadata AS payload, created_at
       FROM delivery_events
       WHERE delivery_id = $1
       ORDER BY created_at ASC`,
      [delivery.id]
    );

    const locations = await query(
      `SELECT
         id,
         ST_Y(location) AS latitude,
         ST_X(location) AS longitude,
         source,
         created_at
       FROM delivery_location_updates
       WHERE delivery_id = $1
       ORDER BY created_at DESC
       LIMIT 200`,
      [delivery.id]
    );

    return {
      delivery: full,
      events: events.rows,
      locations: locations.rows,
    };
  }

  static async getRiderDashboard(riderId) {
    const profile = await this.getRiderProfile(riderId);

    const activeStatuses = ['assigned', 'accepted', 'picked_up', 'in_transit'];
    const activeDeliveries = await this.listRiderDeliveries({
      riderId,
      statuses: activeStatuses,
      limit: 10,
    });

    const todayStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_today,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_today,
         COUNT(*) FILTER (WHERE status IN ('assigned', 'accepted', 'picked_up', 'in_transit'))::int AS active_today
       FROM deliveries
       WHERE assigned_rider_id = $1
         AND created_at::date = CURRENT_DATE`,
      [riderId]
    );

    return {
      profile,
      activeDeliveries,
      todayStats: todayStats.rows[0],
    };
  }

  static async getRiderEarningsHistory({ riderId, limit = 100 }) {
    const profile = await this.getRiderProfile(riderId);
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 300);

    const result = await query(
      `SELECT
         d.id,
         d.order_id,
         d.status,
         d.delivered_at,
         d.failed_at,
         d.failure_reason,
         o.total_amount,
         ROUND(($2 + (o.total_amount * $3))::numeric, 2) AS rider_fee_amount,
         pt.name AS product_name,
         u_buyer.name AS buyer_name
       FROM deliveries d
       INNER JOIN orders o ON d.order_id = o.id
       INNER JOIN users u_buyer ON d.buyer_id = u_buyer.id
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN product_types pt ON p.product_type_id = pt.id
       WHERE d.assigned_rider_id = $1
         AND d.status IN ('delivered', 'failed', 'cancelled')
         AND d.fulfillment_type = 'in_house'
       ORDER BY COALESCE(d.delivered_at, d.failed_at, d.updated_at) DESC
       LIMIT $4`,
      [riderId, Number(profile.base_fee), Number(profile.percentage_rate), safeLimit]
    );

    const total = result.rows.reduce((sum, row) => sum + Number(row.rider_fee_amount || 0), 0);

    return {
      profile,
      items: result.rows,
      totalEarnings: Number(total.toFixed(2)),
    };
  }

  static async getSlaMetrics({ sellerId = null, days = 30, graceMinutes = 10 }) {
    const safeDays = Math.min(Math.max(Number(days) || 30, 1), 365);
    const safeGrace = Math.min(Math.max(Number(graceMinutes) || 10, 0), 120);

    const params = [safeDays, safeGrace];
    let sellerSql = '';

    if (sellerId) {
      params.push(sellerId);
      sellerSql = `AND d.seller_id = $3`;
    }

    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE d.status = 'delivered')::int AS delivered_count,
         COUNT(*) FILTER (
           WHERE d.status = 'delivered'
             AND d.eta_at IS NOT NULL
             AND d.delivered_at <= d.eta_at + ($2::text || ' minutes')::interval
         )::int AS on_time_count,
         ROUND(AVG(
           CASE
             WHEN d.status = 'delivered' AND d.picked_up_at IS NOT NULL
             THEN EXTRACT(EPOCH FROM (d.delivered_at - d.picked_up_at)) / 60
             ELSE NULL
           END
         )::numeric, 2) AS avg_delivery_minutes
       FROM deliveries d
       WHERE d.created_at >= NOW() - ($1::text || ' days')::interval
       ${sellerSql}`,
      params
    );

    const row = result.rows[0] || {
      delivered_count: 0,
      on_time_count: 0,
      avg_delivery_minutes: null,
    };

    const delivered = Number(row.delivered_count || 0);
    const onTime = Number(row.on_time_count || 0);

    return {
      days: safeDays,
      graceMinutes: safeGrace,
      deliveredCount: delivered,
      onTimeCount: onTime,
      onTimeRatePercent: delivered > 0 ? Number(((onTime / delivered) * 100).toFixed(2)) : 0,
      averageDeliveryMinutes: row.avg_delivery_minutes !== null ? Number(row.avg_delivery_minutes) : null,
    };
  }
}

module.exports = Delivery;
