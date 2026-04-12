# UAT Decision Inputs (SQuaRE-Aligned)

## Purpose
This document gathers the information needed to design UAT for this web application using the ISO/IEC 25010:2023 product quality model (selected characteristics).

This is not a UAT test-case document.
It is an evidence and decision baseline for building UAT later.

## SQuaRE Scope Used
Based on your selected ISO/IEC 25010:2023 characteristics:
- Functional suitability
- Performance efficiency
- Interaction capability
- Reliability
- Security
- Maintainability
- Flexibility
- Safety

Compatibility is intentionally excluded per your scope selection.

## Context of Use (for UAT Prioritization)
Derived from implemented system behavior and docs:
- Users: anonymous visitors, buyers, sellers, riders, operations/admin-like maintainers
- User goals:
  - buyer: discover products, order, pay, track delivery
  - seller: manage products, process orders, dispatch delivery, handle refunds
  - rider: accept and fulfill deliveries, update location/status, upload proof
- User environment:
  - web frontend (desktop/mobile browsers)
  - session-based auth
  - location-aware operations (geocoding/maps)
- System context:
  - Next.js frontend + Node/Express backend + PostgreSQL/PostGIS
  - optional payment provider integration (Xendit)
  - optional external notification hooks (email/SMS/push scaffolds)

Primary references:
- [docs/BACKEND_CORE_USE_CASES.md](docs/BACKEND_CORE_USE_CASES.md)
- [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ENVIRONMENT_CONFIG_GUIDE.md](docs/ENVIRONMENT_CONFIG_GUIDE.md)

## Evidence Sources Inventory
Already available in the repository:
- Functional/API behavior: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- Backend use-case catalog: [docs/BACKEND_CORE_USE_CASES.md](docs/BACKEND_CORE_USE_CASES.md)
- Data model and constraints: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- Manual E2E scenario coverage: [docs/MANUAL_E2E_TESTING_GUIDE.md](docs/MANUAL_E2E_TESTING_GUIDE.md)
- Delivery notification operational runbook: [docs/task-progress/TASK_4.12_DELIVERY_NOTIFICATIONS_RUNBOOK.md](docs/task-progress/TASK_4.12_DELIVERY_NOTIFICATIONS_RUNBOOK.md)
- Backup/restore and integrity controls: [docs/BACKUP_RESTORE_RUNBOOK.md](docs/BACKUP_RESTORE_RUNBOOK.md)
- Migration reliability controls: [docs/migrations/MIGRATION_SAFETY_GUIDELINES.md](docs/migrations/MIGRATION_SAFETY_GUIDELINES.md)
- Deployment/installability evidence: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- Developer maintainability workflow: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- Test framework configurations:
  - [playwright.config.ts](playwright.config.ts)
  - [chenda-frontend/jest.config.ts](chenda-frontend/jest.config.ts)
- Automated test suites:
  - [e2e/auth-flow.spec.ts](e2e/auth-flow.spec.ts)
  - [e2e/buyer-journey.spec.ts](e2e/buyer-journey.spec.ts)
  - [e2e/seller-journey.spec.ts](e2e/seller-journey.spec.ts)
  - [server/__tests__/auth.test.js](server/__tests__/auth.test.js)
  - [server/__tests__/products.test.js](server/__tests__/products.test.js)
  - [server/__tests__/search.test.js](server/__tests__/search.test.js)
  - [server/__tests__/users.test.js](server/__tests__/users.test.js)
  - [chenda-frontend/src/__tests__/error-states.test.tsx](chenda-frontend/src/__tests__/error-states.test.tsx)

## SQuaRE Characteristic Baseline (Evidence + UAT Decision Inputs)

## 1) Functional Suitability
Current evidence in code/docs:
- End-to-end business operations are defined and implemented for auth, search, product, order, payment, delivery, notifications, analytics.
- Endpoint-level contracts and examples exist.
- Role-based flows (buyer/seller/rider) are explicit.

Evidence references:
- [docs/BACKEND_CORE_USE_CASES.md](docs/BACKEND_CORE_USE_CASES.md)
- [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- [server/routes](server/routes)
- [server/controllers](server/controllers)

UAT design decisions needed:
- Critical user journeys to mark as release-blocking vs non-blocking.
- Acceptance thresholds for result correctness in ranking/search (business-acceptable behavior vs exact score reproducibility).
- Which optional features are in release scope (e.g., third-party dispatch, external notification hooks, payment provider live mode).

## 2) Performance Efficiency
Current evidence in code/docs:
- Response-time telemetry middleware exists.
- Compression enabled.
- DB health checks exist in container orchestration.
- Playwright and runtime timeouts are configured.

Evidence references:
- [server/app.js](server/app.js)
- [server/middleware/analyticsMiddleware.js](server/middleware/analyticsMiddleware.js)
- [docker-compose.yml](docker-compose.yml)
- [playwright.config.ts](playwright.config.ts)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

UAT design decisions needed:
- User-facing response-time targets per critical flow (search, checkout, dispatch updates).
- Throughput/capacity profile for UAT environment (concurrent users, request rates).
- Resource ceiling definitions for pass/fail (CPU/memory/DB saturation indicators).

## 3) Interaction Capability
Current evidence in code/docs:
- Manual E2E covers full user journeys and mobile responsiveness checks.
- Error-state handling tests exist in frontend.
- Seller/buyer/rider interaction flows are documented and implemented.

Evidence references:
- [docs/MANUAL_E2E_TESTING_GUIDE.md](docs/MANUAL_E2E_TESTING_GUIDE.md)
- [e2e](e2e)
- [chenda-frontend/src/__tests__/error-states.test.tsx](chenda-frontend/src/__tests__/error-states.test.tsx)

UAT design decisions needed:
- Learnability/operability acceptance criteria (time-to-complete key tasks for first-time users).
- Inclusivity/user-assistance checks to include in UAT (language clarity, help cues, form affordances).
- Explicit accessibility scope for UAT (keyboard, screen reader, contrast) since dedicated automated a11y evidence is not currently centralized.

## 4) Reliability
Current evidence in code/docs:
- Health endpoint and operational monitoring routes exist.
- Backup/restore runbook and integrity-check scripts exist.
- Migration safety guidelines and rollback discipline are documented.
- Payment reconciliation and monitoring/alerting services exist.

Evidence references:
- [server/routes/health.js](server/routes/health.js)
- [docs/BACKUP_RESTORE_RUNBOOK.md](docs/BACKUP_RESTORE_RUNBOOK.md)
- [scripts/db-integrity-check.sql](scripts/db-integrity-check.sql)
- [docs/migrations/MIGRATION_SAFETY_GUIDELINES.md](docs/migrations/MIGRATION_SAFETY_GUIDELINES.md)
- [server/services/paymentReconciliationService.js](server/services/paymentReconciliationService.js)
- [server/services/paymentMonitoringService.js](server/services/paymentMonitoringService.js)

UAT design decisions needed:
- Availability window/target during UAT execution.
- Recovery objectives (acceptable restore time and acceptable data-loss window) for UAT pass criteria.
- Fault-tolerance scenarios to include (webhook failure, payment mismatch, delivery update retries).

## 5) Security
Current evidence in code/docs:
- Session-based auth with role-based authorization middleware.
- Helmet/CORS/sanitization/security-related middleware are present.
- Auth rate limiting is enabled on login/register routes.
- Webhook token validation with timing-safe comparison is implemented.
- Security-sensitive tests include auth validation and password complexity.

Evidence references:
- [server/app.js](server/app.js)
- [server/middleware/authenticate.js](server/middleware/authenticate.js)
- [server/routes/auth.js](server/routes/auth.js)
- [server/routes/xenditWebhooks.js](server/routes/xenditWebhooks.js)
- [server/__tests__/auth.test.js](server/__tests__/auth.test.js)
- [docs/ENVIRONMENT_CONFIG_GUIDE.md](docs/ENVIRONMENT_CONFIG_GUIDE.md)

UAT design decisions needed:
- Security scope for UAT vs separate security testing (e.g., penetration testing not part of UAT).
- Required evidence for accountability/non-repudiation for business-critical actions.
- Production-grade settings required during UAT (secrets, HTTPS assumptions, callback tokens, cookie security options).

## 6) Maintainability
Current evidence in code/docs:
- Layered backend structure (routes/controllers/services/models).
- Developer guide includes common change workflows.
- Automated tests exist across backend, frontend, and E2E.
- Migration discipline and operational runbooks are documented.

Evidence references:
- [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- [server](server)
- [chenda-frontend](chenda-frontend)
- [docs/migrations/MIGRATION_SAFETY_GUIDELINES.md](docs/migrations/MIGRATION_SAFETY_GUIDELINES.md)

UAT design decisions needed:
- Which maintainability indicators are acceptable as UAT-adjacent evidence (change lead time, defect escape rate, test update effort).
- Minimum regression suite required per change before UAT sign-off.

## 7) Flexibility
Current evidence in code/docs:
- Config-driven behavior via environment variables and feature flags.
- Dockerized deployment supports environment portability.
- Optional integrations are toggleable (payments, delivery notifications).

Evidence references:
- [docs/ENVIRONMENT_CONFIG_GUIDE.md](docs/ENVIRONMENT_CONFIG_GUIDE.md)
- [docker-compose.yml](docker-compose.yml)
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- [server/services/paymentService.js](server/services/paymentService.js)
- [server/services/deliveryNotificationService.js](server/services/deliveryNotificationService.js)

UAT design decisions needed:
- Which deployment modes must pass UAT (local/Linux only, Docker, cloud/VPS).
- Scalability envelope to validate in UAT-like testing.
- Replaceability assumptions (dependency/provider substitution expectations).

## 8) Safety
Current evidence in code/docs:
- No life-critical safety subsystem is explicitly modeled.
- There are operational safeguards relevant to business harm reduction:
  - validation and role constraints
  - fail/exception handling
  - delivery issue reporting and notification pathways
  - reconciliation/monitoring for payment anomalies

Evidence references:
- [server/controllers/deliveryController.js](server/controllers/deliveryController.js)
- [server/controllers/orderController.js](server/controllers/orderController.js)
- [server/services/paymentMonitoringService.js](server/services/paymentMonitoringService.js)

UAT design decisions needed:
- Define what “safety” means for this domain (financial harm, privacy harm, operational harm).
- Select hazard scenarios to test (wrong role actions, incorrect dispatch, payment/refund misrouting, stale location actions).
- Determine warning/escalation expectations for unacceptable operational states.

## Cross-Cutting Decision Log Inputs (Needed Before Writing UAT)
1. Release scope lock:
- Which features are mandatory for acceptance in this UAT cycle.

2. Environment lock:
- Exact UAT topology, seed data policy, and third-party integration mode (mock/live).

3. Quality thresholds:
- Numeric pass/fail thresholds for response time, availability/recovery, and defect severity gating.

4. Role matrix:
- Final actor-role permissions matrix for UAT sign-off.

5. Evidence policy:
- What counts as acceptable proof for each characteristic (manual observation, API logs, dashboard metrics, DB evidence, automated test pass reports).

## Already Gathered vs Missing (at a glance)
Already gathered in repo:
- Functional behavior definitions and endpoint contracts.
- Core test scenario catalogs (manual + automated).
- Operational runbooks for backup/restore, migration safety, and delivery notification verification.
- Security and role-control implementation patterns.

Still needed as stakeholder decisions (not code extraction):
- Final quality thresholds and tolerances.
- Explicit accessibility/inclusivity acceptance levels.
- Safety interpretation for this product domain.
- Formal UAT pass/fail governance model.

## Notes
- No additional SQuaRE document copy is needed to proceed with this baseline; your provided excerpt is sufficient for scoping.
- This document is intended to be the source used before creating the actual UAT plan, scenarios, and acceptance matrix.
