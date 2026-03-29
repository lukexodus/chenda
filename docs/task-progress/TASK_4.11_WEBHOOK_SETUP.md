# Task 4.11 Progress: Xendit Webhook Setup (Development)

Date: 2026-03-29
Status: In Progress (Task 4.11 backend and core frontend flows complete; polishing and QA remaining)

## Scope Completed

Implemented development webhook endpoints in the Express backend for Xendit callbacks with `x-callback-token` verification and payload logging.

Implemented backend payment foundation for Task 4.11.1 - 4.11.5:
- Added Xendit Payment Requests V3 service integration scaffold (`server/services/xenditService.js`)
- Added multi-attempt payment tracking model (`server/models/PaymentAttempt.js`)
- Added idempotency-aware payment orchestration (`server/services/paymentService.js`)
- Updated order payment flow to require `Idempotency-Key` header on payment request
- Added webhook-to-order payment status mapping in `server/routes/xenditWebhooks.js`
- Added database migration for lifecycle status + attempts (`migrations/005_payment_integration.sql`)

Implemented backend work for Task 4.11.8 and 4.11.9:
- Added refunds ledger migration (`migrations/006_refunds_reconciliation.sql`)
- Added refund model (`server/models/Refund.js`)
- Added seller refund API (`POST /api/orders/:id/refunds`) with cumulative partial refunds
- Added reconciliation service (`server/services/paymentReconciliationService.js`)
- Added manual reconciliation endpoint (`POST /api/orders/reconciliation/run`)

Implemented frontend work for Task 4.11.6 and 4.11.7:
- Replaced mock payment modal behavior with real payment initiation to `POST /api/orders/:id/payment`
- Added `Idempotency-Key` header support per payment initiation request
- Added GCash checkout action links from backend `checkoutUrl` response
- Updated checkout to default to GCash and show real flow guidance
- Added seller-side refund form/actions in order detail modal
- Added seller-side manual reconciliation trigger in orders page
- Added seller settlement reporting page (`/seller/payments`)
- Added seller payout overview (gross/refunded/net) and 7-day trend snapshot
- Added settlement status filtering with per-order net payout rows

Implemented backend work for Task 4.11.10:
- Added webhook telemetry table + alerts table migration (`migrations/007_payment_monitoring_alerts.sql`)
- Added monitoring service (`server/services/paymentMonitoringService.js`)
- Added seller monitoring summary endpoint (`GET /api/orders/payment-monitoring/summary`)
- Added seller alert acknowledgement endpoint (`POST /api/orders/payment-monitoring/alerts/:alertId/ack`)
- Wired webhook route to record processed/ignored/failed/unauthorized/misconfigured events and raise alerts

### Endpoints Added

- `POST /api/webhooks/xendit/ewallet-payment-status`
- `POST /api/webhooks/xendit/invoices`
- `POST /api/webhooks/xendit/payment-requests-v3`

### Public URLs (ngrok)

- eWallet Payment Status (GCash):
  - `https://dimly-calentural-larita.ngrok-free.dev/api/webhooks/xendit/ewallet-payment-status`
- Invoices:
  - `https://dimly-calentural-larita.ngrok-free.dev/api/webhooks/xendit/invoices`
- Payment Requests V3:
  - `https://dimly-calentural-larita.ngrok-free.dev/api/webhooks/xendit/payment-requests-v3`

## Files Updated

- `server/routes/xenditWebhooks.js` (new)
- `server/app.js` (route mounting)
- `server/.env.example` (added `XENDIT_CALLBACK_TOKEN`)
- `docs/ENVIRONMENT_CONFIG_GUIDE.md` (variable docs)
- `server/services/xenditService.js` (new)
- `server/models/PaymentAttempt.js` (new)
- `server/services/paymentService.js` (rewritten for production flow)
- `server/controllers/orderController.js` (idempotency + provider flow)
- `server/routes/orders.js` (updated payment validation)
- `server/models/Order.js` (expanded payment lifecycle handling)
- `migrations/005_payment_integration.sql` (new)
- `migrations/006_refunds_reconciliation.sql` (new)
- `server/models/Refund.js` (new)
- `server/services/paymentReconciliationService.js` (new)
- `migrations/007_payment_monitoring_alerts.sql` (new)
- `server/services/paymentMonitoringService.js` (new)
- `chenda-frontend/src/components/payment/PaymentModal.tsx` (real payment initiation flow)
- `chenda-frontend/src/app/(buyer)/checkout/page.tsx` (GCash-first checkout UI)
- `chenda-frontend/src/app/seller/orders/page.tsx` (refund + reconciliation actions)
- `chenda-frontend/src/app/seller/payments/page.tsx` (settlement history + payout reporting)
- `chenda-frontend/src/components/layout/navigation.tsx` (seller payments tab)
- `chenda-frontend/src/lib/types/order.ts` (updated payment lifecycle/types)

## Notes

- The webhook token is verified with constant-time comparison.
- Each webhook logs headers metadata + full payload and returns HTTP 200 quickly.
- Missing or invalid callback token returns HTTP 401.
- Missing server-side token configuration returns HTTP 500.

## Next Steps

1. Run migration: `node migrations/migrate.js up` (applies `005_payment_integration.sql`).
2. Configure `.env` for payment provider:
  - `ENABLE_PAYMENT_XENDIT=true`
  - `XENDIT_SECRET_KEY=...`
  - `XENDIT_CALLBACK_TOKEN=...`
3. Create payment through `POST /api/orders/:id/payment` with `Idempotency-Key` header.
4. Validate webhook updates payment attempt + order status transitions.
5. Add cron scheduler invoking reconciliation service periodically (cron-ready service already in place).
6. Run E2E checks for buyer payment and seller payout flows.
7. Tighten production alert routing (email/Slack/webhook sink) for payment alerts.
