**CLI (psql)**

```bash
# Connect to the chenda database
psql -h localhost -p 5432 -U postgres -d chenda

# If password is set, it will prompt. If blank, just hit Enter.
```

Useful psql commands once inside:
```sql
\dt                          -- list all tables
\d users                     -- describe a table
\d products

SELECT * FROM users LIMIT 10;
SELECT * FROM products LIMIT 10;
SELECT * FROM orders LIMIT 10;
SELECT * FROM product_types LIMIT 10;
SELECT * FROM analytics_events LIMIT 10;

\q                           -- quit
```

Or as a one-liner without entering the shell:
```bash
psql -h localhost -U postgres -d chenda -c "SELECT id, name, email, type FROM users;"
```

---

**DBeaver**

1. Open DBeaver → **New Database Connection** (Ctrl+Shift+N)
2. Select **PostgreSQL** → Next
3. Fill in:
   | Field | Value |
   |---|---|
   | Host | `localhost` |
   | Port | `5432` |
   | Database | `chenda` |
   | Username | `postgres` |
   | Password | *(blank — from your .env)* |
4. Click **Test Connection** — it will auto-download the JDBC driver if needed → **Finish**

Once connected, navigate: `chenda` → `Schemas` → `public` → `Tables` to browse all tables visually.

---

**Destructive Operations (Development Only)**

Use these carefully to reset data during development.

**Delete all orders**
This will also remove all associated deliveries, tracking history, and events due to `ON DELETE CASCADE` constraints.

```bash
# Using a one-liner (Local/Non-Docker)
psql -h localhost -U postgres -d chenda -c "TRUNCATE TABLE orders RESTART IDENTITY CASCADE;"

# Using Docker Compose (from host)
docker compose exec db psql -U postgres -d chenda -c "TRUNCATE TABLE orders RESTART IDENTITY CASCADE;"
```

**Delete all users & products**
If you want a completely fresh start (warning: destructive!):

```bash
# Using Docker Compose (from host)
docker compose exec db psql -U postgres -d chenda -c "TRUNCATE TABLE users RESTART IDENTITY CASCADE;"
```

**Inside psql (either Docker or Local)**
```sql
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
```