## Seeding Guide (Docker Compose)

Use this guide when running Chenda with Docker Compose.

## Preconditions

Before any seed command:

1. Containers are running: `docker compose up -d`
2. Migrations are already applied
3. You are in the project root

## Seeding Options

| Option | Command | Scope | Keeps users/product types? | Typical use |
|---|---|---|---|---|
| Safe first seed | `node seeds/seed.js` | Full seed if DB is empty | N/A | First setup on fresh DB |
| Full reset | `node seeds/seed.js --force` | Reseed all datasets | No | Rebuild complete test DB |
| Products-only reseed | `node seeds/seed.js --products-only` | Clears `orders` + `products`, then reseeds product files | Yes | Refresh product listings quickly |
| Clear-only utility | `node seeds/clear-products.js --confirm` | Clears `orders` + `products` only | Yes | Manual cleanup before custom tests |

Note: `--products-only` does not generate new timestamps dynamically. It reloads values exactly as defined in SQL seed files.

## Recommended Flows

### Flow A: First-time seed

```bash
node seeds/seed.js
```

### Flow B: Full reseed from scratch

```bash
node seeds/seed.js --force
```

### Flow C: Fast day-to-day refresh (keep users/types)

```bash
node seeds/seed.js --products-only
```

## Running Seeder in Docker Compose

If Node is not installed on the host, run the seeder inside a temporary backend container:

```bash
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/seeds \
	--entrypoint node \
	backend seed.js --products-only
```

Windows PowerShell equivalent:

```powershell
docker compose run --rm `
	-v "${PWD}:/workspace" `
	-w /workspace/seeds `
	--entrypoint node `
	backend seed.js --products-only
```

## Why orders are cleared with products-only

The `orders` table references `products` through a foreign key. Clearing products first would fail with FK constraints, so the process deletes orders before products.

## Quick Validation

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT 'product_types' AS table, COUNT(*) FROM product_types
	UNION ALL
	SELECT 'users', COUNT(*) FROM users
	UNION ALL
	SELECT 'products', COUNT(*) FROM products
	UNION ALL
	SELECT 'orders', COUNT(*) FROM orders;
"
```
