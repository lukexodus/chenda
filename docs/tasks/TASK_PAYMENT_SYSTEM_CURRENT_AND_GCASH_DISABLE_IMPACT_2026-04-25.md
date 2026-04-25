# Payment System Status and GCash Disable Impact Map

Date: 2026-04-25
Author: Copilot
Status: Analysis + UI-only implementation complete (GCash disabled in checkout UI, retained in code)

## Implementation Update (2026-04-25)

Applied requested UI behavior for checkout payment options:

- GCash remains visible.
- GCash is disabled (transparent/muted and unclickable).
- Default selected method is now Cash on Delivery.
- Added defensive payment modal guard to block disabled methods if passed accidentally.

Files updated:

- `chenda-frontend/src/lib/types/order.ts`
- `chenda-frontend/src/app/(buyer)/checkout/page.tsx`
- `chenda-frontend/src/components/payment/PaymentModal.tsx`

## 1) Current Payment System (As Implemented)

This is the current implemented payment system based on backend + frontend code, migrations, and runtime flags.

## 1.1 Payment methods and feature flags

Payment methods are feature-flagged in backend service logic:

- `cash` (Cash on Delivery / manual flow)
- `gcash` (Xendit e-wallet flow)

Flags currently used:

- `ENABLE_PAYMENT_COD` (default `true`)
- `ENABLE_PAYMENT_GCASH` (default `true`)
- `ENABLE_PAYMENT_XENDIT` (default `false` unless enabled)

Where this is enforced:

- `server/services/paymentService.js`
- `server/services/xenditService.js`
- `server/.env.example`

## 1.2 Backend flow

### Order creation

- Buyer creates one order via `POST /api/orders` or many via `POST /api/orders/batch`.
- Controller validates that `payment_method` is currently supported via `paymentService.isMethodSupported(...)`.
- New orders are created with:
  - `payment_status = pending`
  - `order_status = pending`

Primary files:

- `server/controllers/orderController.js`
- `server/models/Order.js`

### Payment initiation

- Buyer initiates payment using `POST /api/orders/:id/payment`.
- `Idempotency-Key` header is required.
- Payment orchestration is handled in `paymentService.processOrderPayment(...)`.

Method-specific behavior:

- COD (`cash`):
  - Creates a `payment_attempts` row with provider `manual`.
  - Keeps payment state pending/manual collection.
  - Returns no checkout URL.
- GCash (`gcash`):
  - Calls Xendit Payment Requests API via `xenditService.createPaymentRequest(...)`.
  - Creates `payment_attempts` row with provider `xendit`.
  - Returns checkout URL so frontend can open hosted checkout.

Primary files:

- `server/controllers/orderController.js`
- `server/services/paymentService.js`
- `server/services/xenditService.js`
- `server/models/PaymentAttempt.js`
- `server/models/Order.js`

### Webhooks and status synchronization

- Xendit callbacks are handled at:
  - `POST /api/webhooks/xendit/ewallet-payment-status`
  - `POST /api/webhooks/xendit/invoices`
  - `POST /api/webhooks/xendit/payment-requests-v3`
- Callback token check uses `XENDIT_CALLBACK_TOKEN`.
- Webhook events update `payment_attempts` and corresponding `orders.payment_status`.
- Monitoring events/alerts are recorded for failures, unauthorized callbacks, and misconfiguration.

Primary files:

- `server/routes/xenditWebhooks.js`
- `server/services/paymentService.js`
- `server/services/paymentMonitoringService.js`

### Refunds, reconciliation, monitoring, reporting

Implemented seller-side payment operations:

- Refunds: `POST /api/orders/:id/refunds`
- Reconciliation run: `POST /api/orders/reconciliation/run`
- Monitoring summary: `GET /api/orders/payment-monitoring/summary`
- Alert acknowledgment: `POST /api/orders/payment-monitoring/alerts/:alertId/ack`
- Seller settlements: `GET /api/orders/seller/payments/settlements`
- Seller payout overview: `GET /api/orders/seller/payments/overview`

Primary files:

- `server/controllers/orderController.js`
- `server/services/paymentReconciliationService.js`
- `server/services/paymentMonitoringService.js`
- `server/services/paymentReportingService.js`

## 1.3 Frontend flow

### Checkout page

- Buyer checkout page currently starts with GCash selected by default.
- Payment method options are rendered from static `PAYMENT_METHODS` in frontend types (cash + gcash).
- Order batch creation sends selected `payment_method` to backend.

Primary files:

- `chenda-frontend/src/app/(buyer)/checkout/page.tsx`
- `chenda-frontend/src/lib/types/order.ts`

### Payment modal

- `PaymentModal` auto-initiates payment calls after order creation.
- For GCash:
  - Collects backend checkout URLs.
  - Shows "Open GCash Checkout" actions and waits for buyer to complete externally.
- For COD:
  - Completes directly without external checkout URL.

Primary files:

- `chenda-frontend/src/components/payment/PaymentModal.tsx`

## 1.4 Data model status

Payment-related persistence currently includes:

- `orders.payment_method` (values include cash/gcash/card in schema constraints)
- `orders.payment_status` lifecycle expanded (pending/authorized/captured/paid/failed/refunded)
- `orders.payment_provider`, `orders.external_payment_id`
- `payment_attempts` table with idempotency and provider payloads
- `refunds`, `payment_reconciliation_runs`, webhook telemetry + alerts tables

Primary migrations:

- `migrations/001_create_tables.sql`
- `migrations/005_payment_integration.sql`
- `migrations/006_refunds_reconciliation.sql`
- `migrations/007_payment_monitoring_alerts.sql`

## 1.5 Notable alignment caveat

Some docs still describe older "mock payment" behavior (including cash/gcash/card simulations), while current code has production-oriented flow for GCash + manual COD with idempotency and webhook integration.

---

## 2) Impact Map for Request: "Disable GCash UI (transparent, unclickable), keep COD only"

Important: This section is investigation/planning only. No implementation is applied in this document.

Goal interpretation:

- Do not remove GCash from codebase.
- Keep GCash visible in checkout UI but disabled (unclickable + visually muted/transparent).
- Ensure buyer can only select and proceed with COD in current UX.

## 2.1 Files that must be edited

### A) Buyer checkout selection behavior (required)

1. `chenda-frontend/src/app/(buyer)/checkout/page.tsx`

Required changes:

- Change default selected payment method from `gcash` to `cash`.
- Disable interaction for GCash option in the payment method list.
- Apply muted/transparency styling for disabled option.
- Prevent switching to GCash via radio group interactions.
- Update informational alert text (remove GCash-first guidance and replace with COD-only temporary message).

Why required:

- This is where selection state and payment method radio UI are controlled.

### B) Payment method metadata / typing support for disabled state (required)

2. `chenda-frontend/src/lib/types/order.ts`

Likely changes:

- Extend `PaymentMethodOption` with optional UI metadata for temporary disable state (for example `disabled?: boolean`, `disabledReason?: string`).
- Mark GCash option as disabled while keeping it in array.

Why required:

- Keeps disable state declarative and avoids ad hoc hardcoding in multiple components.

### C) Payment modal safety guard (recommended, high value)

3. `chenda-frontend/src/components/payment/PaymentModal.tsx`

Recommended changes:

- Add guard so modal refuses to process disabled methods (defensive UI check).
- Keep existing GCash flow code intact but unreachable from checkout during temporary disable.

Why recommended:

- Prevents accidental future invocation if parent UI regresses.

## 2.2 Backend/API files to review (may or may not change)

If requirement is strictly "disable in UI only," backend changes are optional. Still, these are the relevant files to decide policy:

4. `server/services/paymentService.js`

- Already supports feature-flag hiding of GCash via `ENABLE_PAYMENT_GCASH=false`.
- If product decision is to enforce COD-only at API level too, set this flag false and ensure deployment env uses it.
- No code edit required if only environment toggle is used.

5. `server/routes/orders.js`

- Validation currently allows `cash` and `gcash` in request body.
- If enforcing backend-only COD, this validator should eventually be aligned to enabled methods (dynamic), not hardcoded list.

6. `server/controllers/orderController.js`

- Already checks `paymentService.isMethodSupported(payment_method)` at create/batch create.
- If `ENABLE_PAYMENT_GCASH=false`, API naturally rejects GCash order creation.

## 2.3 Environment/config files (if enforcing server-side too)

7. `server/.env`
8. `server/.env.example`
9. `docs/setup/ENVIRONMENT_CONFIG_GUIDE.md`

Potential updates:

- Set or document `ENABLE_PAYMENT_GCASH=false` for temporary rollout.
- Keep `ENABLE_PAYMENT_COD=true`.

## 2.4 Tests and automation likely affected

### E2E helper typing/flow

10. `e2e/helpers/testHelpers.ts`

- Helper type currently includes `'cash' | 'gcash' | 'card'`.
- If tests include method-selection checks, helper should handle disabled GCash expectation.

11. `e2e/buyer-journey.spec.ts`

- Currently uses cash in checkout path; should still pass.
- Add/adjust scenario to verify GCash option is visible but disabled and not selectable.

### Frontend unit/integration tests (new files may be needed if absent)

Current workspace search did not show strong coverage for checkout payment method UI behavior. To prevent regressions, likely add:

- new test file under checkout component tests (for disabled method rendering + blocked selection)
- optional test for PaymentModal guard

Suggested new files (if test suite pattern permits):

- `chenda-frontend/src/app/(buyer)/checkout/__tests__/page.payment-methods.test.tsx`
- `chenda-frontend/src/components/payment/__tests__/PaymentModal.test.tsx`

These are optional but strongly recommended for temporary-feature behavior.

## 2.5 Documentation files likely requiring updates

If/when GCash is disabled in UI, update docs to avoid mismatch:

12. `docs/tasks/TASK_4.11_WEBHOOK_SETUP.md`
13. `docs/architecture/API_DOCUMENTATION.md`
14. `docs/setup/USER_GUIDE.md`
15. `docs/operations/MANUAL_E2E_TESTING_GUIDE.md`

Also check historical references mentioning GCash-first or mock multi-method flows:

- `README.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/learning/PROJECT_LEARNING_GUIDE.md`
- `docs/tasks/TASK_BREAKDOWN.md`

## 2.6 Functional areas to verify after implementation

For the AI doing implementation, these are the verification targets:

1. Checkout loads with COD selected by default.
2. GCash is shown but visually muted/transparent.
3. GCash option cannot be clicked/selected by mouse or keyboard.
4. Place order submits with `payment_method: cash`.
5. Payment modal runs COD path and reaches success state.
6. No GCash checkout buttons are shown in normal buyer flow.
7. Existing historical orders with `payment_method = gcash` still render correctly in order detail/history/seller reporting pages.

---

## 3) Summary Recommendation

For fastest safe rollout, use a two-layer approach:

- UI layer: disable GCash option (visible but unclickable, transparent) and default to COD.
- API layer (optional but safer): set `ENABLE_PAYMENT_GCASH=false` in runtime env to reject non-COD requests server-side too.

This keeps GCash code intact for future re-enable while ensuring current users effectively transact via COD only.
