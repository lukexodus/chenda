-- Data integrity checks for critical tables
-- Run with: psql -h ... -U ... -d ... -f db-integrity-check.sql

-- Users: unique email, no nulls
SELECT COUNT(*) AS total_users, COUNT(DISTINCT email) AS unique_emails FROM users;
SELECT COUNT(*) AS null_emails FROM users WHERE email IS NULL;

-- Products: must have valid seller, positive price/quantity
SELECT COUNT(*) AS orphan_products FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE u.id IS NULL;
SELECT COUNT(*) AS invalid_price FROM products WHERE price <= 0;
SELECT COUNT(*) AS invalid_quantity FROM products WHERE quantity < 0;

-- Orders: must have valid buyer/seller, positive total
SELECT COUNT(*) AS orphan_orders FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE u.id IS NULL;
SELECT COUNT(*) AS invalid_total FROM orders WHERE total_amount < 0;

-- Add more checks as needed for new tables
