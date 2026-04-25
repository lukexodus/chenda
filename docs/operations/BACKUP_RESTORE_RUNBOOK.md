# Database Backup & Restore Runbook

## Overview
This runbook documents how to back up and restore the PostgreSQL database for Chenda, including retention policy and integrity checks.

---

## 1. Automated Backup

- Script: `scripts/backup-db.sh`
- Default retention: 7 days (configurable via `RETENTION_DAYS`)
- Usage:
  ```bash
  ./scripts/backup-db.sh [backup-dir]
  ```
- Output: Compressed `.sql.gz` file in backup directory
- Old backups older than retention are deleted automatically

### Environment Variables
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PORT` (default: chenda, postgres, localhost, 5432)

---

## 2. Restore Procedure

- Script: `scripts/restore-db.sh`
- Usage:
  ```bash
  ./scripts/restore-db.sh <backup-file.sql.gz>
  ```
- Restores the database from the specified backup file

---

## 3. Restore Drill (Verification)

1. Create a new/clean database instance (local or test environment)
2. Run the restore script with a recent backup
3. Run integrity checks:
   ```bash
   psql -h ... -U ... -d ... -f scripts/db-integrity-check.sql
   ```
4. Verify all counts and constraints are as expected

---

## 4. Migration Safety Checks

- Always run migrations on a test database first (dry-run)
- Use transaction blocks for reversible migrations
- Set lock timeout to avoid long production locks:
  ```sql
  SET lock_timeout = '10s';
  ```
- Document rollback steps for each migration

---

## 5. Zero-Downtime Migration Guidelines

- Prefer additive changes (add columns, tables) over destructive
- Avoid dropping columns/tables in the same deploy as code changes
- Use `NULL` defaults, then backfill, then set `NOT NULL` in a later migration
- For large data changes, batch updates in small chunks

---

## 6. Data Integrity Checks

- Use `scripts/db-integrity-check.sql` to validate critical tables after restore or migration
- Add new checks as schema evolves

---

## 7. Retention & Recovery Policy

- Keep at least 7 days of daily backups
- Test restore at least once per quarter
- Store backups offsite if possible (cloud, external disk)

---

## 8. Troubleshooting

- If backup or restore fails, check environment variables and DB connectivity
- For permission errors, ensure the DB user has sufficient rights
- For large databases, monitor disk space and backup duration
