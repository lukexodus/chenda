### How to delete and reseed

#### Option A — The fast way (products only, keeps your users)

```bash
# Step 1: delete all products (and orders)
node seeds/clear-products.js --confirm

# Step 2: reseed only products with fresh dates
node seeds/seed.js --products-only
```

The `--products-only` flag deletes products/orders, resets the ID sequence, then runs mock_products.sql + `nationwide_products.sql` with today's dates in DB.

---

#### Option B — Full nuclear reset (wipes everything)

```bash
node seeds/seed.js --force
```

This truncates products → users → product_types, then reruns all four seed files from scratch.

---

#### Dry-run first (safe preview)

```bash
# Shows current counts without touching anything
node seeds/clear-products.js
```

---

> **Note:** Both scripts read your .env automatically, so no need to specify DB credentials manually. The `--products-only` path is what you'll use day-to-day for manual testing — it's fast and leaves your user accounts intact.
