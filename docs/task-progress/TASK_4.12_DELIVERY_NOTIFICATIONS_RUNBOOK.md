# Task 4.12 Runbook: Delivery Notifications (In-App + External Hooks)

Date: 2026-03-30  
Status: Ready for QA / staging verification

## Scope

This runbook verifies Task 4.12.9 behavior across:

- In-app delivery notifications
- Unread count API + badges
- Single / bulk mark-as-read
- Near-destination trigger from rider location updates
- External notification hook scaffolding (email/SMS/push feature flags)

## Prerequisites

1. Backend running on `http://localhost:3001`
2. Frontend running on `http://localhost:3000`
3. Migrations applied (including delivery tables):
   - `001` to `008`
4. Seed data exists (`node seeds/seed.js`) or equivalent test users/orders
5. You can authenticate as seller, rider, and buyer

## Environment Flags

Set in `server/.env` (or environment-specific file):

```env
# In-app notifications always work via DB tables/endpoints.
# External hooks are optional and disabled by default.
ENABLE_EXTERNAL_DELIVERY_NOTIFICATIONS=false
ENABLE_DELIVERY_EMAIL=false
ENABLE_DELIVERY_SMS=false
ENABLE_DELIVERY_PUSH=false
DELIVERY_EMAIL_PROVIDER=provider_not_configured
DELIVERY_SMS_PROVIDER=provider_not_configured
DELIVERY_PUSH_PROVIDER=provider_not_configured

# Near-destination trigger threshold (meters)
DELIVERY_NEAR_DESTINATION_METERS=300
```

Restart backend after edits.

## Core API Endpoints

- Seller dispatch:
  - `POST /api/deliveries/orders/:orderId/assign-in-house`
  - `POST /api/deliveries/orders/:orderId/dispatch-third-party`
- Rider lifecycle:
  - `POST /api/deliveries/:id/accept`
  - `PUT /api/deliveries/:id/status`
  - `POST /api/deliveries/:id/location`
  - `POST /api/deliveries/:id/proof-photo`
- Tracking and issues:
  - `GET /api/deliveries/orders/:orderId/tracking`
  - `POST /api/deliveries/orders/:orderId/issues`
- Notifications:
  - `GET /api/deliveries/notifications/me`
  - `GET /api/deliveries/notifications/me/unread-count`
  - `POST /api/deliveries/notifications/:notificationId/read`
  - `POST /api/deliveries/notifications/me/read-all`

## Scenario A: Seller assigns rider -> buyer+rider get in-app notification

1. Authenticate as seller.
2. Call `POST /api/deliveries/orders/:orderId/assign-in-house` with `rider_id`.
3. Authenticate as buyer and call `GET /api/deliveries/notifications/me`.
4. Authenticate as rider and call `GET /api/deliveries/notifications/me`.

Expected:

- Buyer and rider each see a new `delivery_assigned` notification.
- Notification message reflects rider assignment.

## Scenario B: Rider status updates -> buyer+seller notified

1. Authenticate as rider.
2. Accept assignment: `POST /api/deliveries/:id/accept`.
3. Update status to picked up: `PUT /api/deliveries/:id/status` body `{ "status": "picked_up" }`.
4. Update status to in transit: `PUT /api/deliveries/:id/status` body `{ "status": "in_transit" }`.

Expected:

- Buyer and seller receive notifications for each status event.
- `GET /api/deliveries/orders/:orderId/tracking` shows corresponding events.

## Scenario C: Near-destination trigger

1. Ensure delivery is in `picked_up` or `in_transit`.
2. For easier QA, optionally set `DELIVERY_NEAR_DESTINATION_METERS=1000` and restart backend.
3. Send rider location update near buyer location:
   - `POST /api/deliveries/:id/location`
   - Body: `{ "lat": <near_buyer_lat>, "lng": <near_buyer_lng>, "source": "manual" }`
4. Repeat location update call 2-3 times.

Expected:

- First qualifying update creates one `delivery_near_destination` event.
- Buyer and seller receive one near-destination notification.
- Repeated qualifying updates do not duplicate the near-destination event.

## Scenario D: Notification read flow

1. Authenticate as any user with unread notifications.
2. Check `GET /api/deliveries/notifications/me/unread-count`.
3. Mark one notification read:
   - `POST /api/deliveries/notifications/:notificationId/read`
4. Check unread count again.
5. Mark remaining read:
   - `POST /api/deliveries/notifications/me/read-all`
6. Check unread count again.

Expected:

- Unread count decreases after single read.
- Unread count becomes `0` after bulk read.
- Notifications list shows `read_at` timestamps.

## Scenario E: External hook scaffolding toggle

1. Set:

```env
ENABLE_EXTERNAL_DELIVERY_NOTIFICATIONS=true
ENABLE_DELIVERY_EMAIL=true
DELIVERY_EMAIL_PROVIDER=sendgrid
```

2. Restart backend.
3. Trigger any delivery notification event (assign, status, issue, near-destination).
4. Check backend logs.

Expected:

- In-app notifications still persist in DB.
- Backend logs show external hook execution attempts (provider label + event metadata).
- No hard failure to core delivery flow if external hook fails.

## DB Verification Queries

```sql
-- Latest delivery notifications for a user
SELECT id, delivery_id, event_type, title, message, read_at, created_at
FROM delivery_notifications
WHERE user_id = <USER_ID>
ORDER BY created_at DESC
LIMIT 20;

-- Delivery timeline includes near destination event
SELECT id, delivery_id, event_type, event_note, metadata, created_at
FROM delivery_events
WHERE delivery_id = <DELIVERY_ID>
ORDER BY created_at ASC;

-- Confirm near-destination only once per delivery
SELECT event_type, COUNT(*)
FROM delivery_events
WHERE delivery_id = <DELIVERY_ID>
  AND event_type = 'delivery_near_destination'
GROUP BY event_type;
```

## Known Limits (Current Scope)

- External email/SMS/push integrations are provider-ready scaffolds; no real provider credential flow yet.
- Push tokens and user phone fields are not yet modeled for production delivery channels.
- Near-destination is threshold-based and event-once per delivery.

## Exit Criteria

- In-app notifications verified for assignment, lifecycle, issue report, near-destination, and delivered events.
- Unread count, single-read, and bulk-read flows verified.
- Tracking endpoint reflects event timeline updates.
- External hook scaffolding verified behind feature flags without breaking main flow.
