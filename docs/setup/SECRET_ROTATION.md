# Secret Rotation Runbook

This runbook defines how to rotate high-risk secrets without downtime where possible.

## Scope

Rotate these secrets regularly and immediately after any suspected leak:
- `SESSION_SECRET`
- `DB_PASSWORD`
- Payment provider keys (for example GCash provider API keys)
- Notification provider API keys

## Rotation Cadence

- Production: every 90 days
- Staging: every 90 days
- Immediately after team member offboarding with secret access
- Immediately after any incident involving logs, screenshots, or exposed env files

## 1) Session Secret Rotation (`SESSION_SECRET`)

Impact:
- Existing sessions become invalid after restart with a new secret.

Steps:
1. Generate a new secret:
   - `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Update `SESSION_SECRET` in the target environment secret store.
3. Deploy backend.
4. Verify login/logout flow and cookie issuance.
5. Announce that users may need to log in again.

Rollback:
- Revert to previous `SESSION_SECRET` only if required for incident response.
- Rotate again once issue is fixed.

## 2) Database Password Rotation (`DB_PASSWORD`)

Impact:
- Brief reconnection window during credential switch.

Steps:
1. Create a new database password for the app role.
2. Update backend secret store with the new `DB_PASSWORD`.
3. Restart or redeploy backend instances.
4. Verify DB health endpoint and critical API routes.
5. Remove old credential from password manager and vault metadata.

Rollback:
- Temporarily restore old password if deployment cannot reconnect.
- Re-run rotation with change window.

## 3) Third-Party API Key Rotation

Steps:
1. Generate a new key in provider dashboard.
2. Set new key in staging first; validate payment/notification webhooks.
3. Promote key to production.
4. Revoke old key after successful validation.

Validation checklist:
- Payment create/confirm works
- Webhook signature verification works
- Notification send test succeeds

## Security Notes

- Never commit `.env` files.
- Never paste secrets in issues, PRs, or chat.
- Restrict secret manager access to least privilege.
- Audit access logs after every rotation.

## Ownership

- Primary owner: Backend lead
- Secondary owner: DevOps/on-call engineer
- Escalation: Project maintainer
