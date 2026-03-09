const { query } = require('./config/database');

async function main() {
  // Find all sellers
  const sellers = await query(
    "SELECT id, name, email, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM users WHERE type IN ('seller','both') AND location IS NOT NULL"
  );
  console.log('SELLERS:', JSON.stringify(sellers.rows, null, 2));

  // Find cherry tomato products with both product and seller coords
  const products = await query(
    "SELECT p.id, pt.name as type_name, p.description, " +
    "ST_X(p.location::geometry) as p_lng, ST_Y(p.location::geometry) as p_lat, " +
    "ST_X(u.location::geometry) as u_lng, ST_Y(u.location::geometry) as u_lat, " +
    "u.name as seller_name, u.id as seller_id " +
    "FROM products p " +
    "JOIN users u ON p.seller_id = u.id " +
    "JOIN product_types pt ON p.product_type_id = pt.id " +
    "WHERE pt.name ILIKE '%tomato%' OR pt.name ILIKE '%cherry%' " +
    "LIMIT 10"
  );
  console.log('CHERRY TOMATO PRODUCTS:', JSON.stringify(products.rows, null, 2));

  // Check buyer2
  const buyers = await query(
    "SELECT id, name, email, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM users WHERE type IN ('buyer','both') AND location IS NOT NULL"
  );
  console.log('BUYERS:', JSON.stringify(buyers.rows, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
