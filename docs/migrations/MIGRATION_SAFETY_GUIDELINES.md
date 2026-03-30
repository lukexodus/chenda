# Migration Safety Guidelines

## 1. Dry-Run Migrations
- Always test migrations on a staging or local copy of the database before production.
- Use `migrate.js` or manual `psql` with a test DB.

## 2. Transactional Migrations
- Wrap schema/data changes in a transaction when possible:
  ```sql
  BEGIN;
  -- migration SQL
  COMMIT;
  ```
- If a migration cannot be wrapped (e.g., certain DDL), document why.

## 3. Lock Timeout
- Set a lock timeout to avoid blocking production for long periods:
  ```sql
  SET lock_timeout = '10s';
  ```
- Abort migration if lock cannot be acquired quickly.

## 4. Rollback Notes
- For each migration, document how to reverse the change if needed.
- If not reversible, note this clearly in the migration file and in the migration log.

## 5. Zero-Downtime Principles
- Prefer additive changes (add columns, tables) over destructive changes.
- Avoid dropping columns/tables in the same deploy as code changes.
- Use nullable columns first, backfill data, then set NOT NULL in a later migration.
- For large data changes, batch updates in small chunks.

## 6. Verification
- After migration, run `scripts/db-integrity-check.sql` to validate data.
- Check application logs for errors immediately after migration.

## 7. Communication
- Announce planned migrations to the team in advance.
- Schedule major schema changes during low-traffic windows.
