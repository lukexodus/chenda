# Chenda Algorithm Explanation

This document explains how the Chenda search algorithm works in the backend, from request input to ranked output. Code snippets below are based on the implementation in `server/algorithm` and `server/controllers/searchController.js`.

## 1. What Problem the Algorithm Solves

Given:
- Buyer location
- Active products from the database
- Buyer constraints and preferences

The algorithm:
1. Enriches products with distance and shelf-life metrics
2. Filters products by constraints (radius, freshness, storage)
3. Ranks products by weighted score (proximity + freshness)
4. Returns products and execution metadata

## 2. Entry Point: `chendaAlgorithm()`

Main module: `server/algorithm/chenda_algorithm.js`

```js
function chendaAlgorithm(buyer, products, config = {}) {
  const startTime = Date.now();

  if (!buyer || typeof buyer.latitude !== 'number' || typeof buyer.longitude !== 'number') {
    throw new Error('Invalid buyer object: must have latitude and longitude');
  }

  if (!Array.isArray(products)) {
    throw new Error('Products must be an array');
  }

  const defaultConfig = {
    max_radius: 10,
    weights: {
      proximity_weight: 0.4,
      freshness_weight: 0.6
    },
    min_freshness_score: 0,
    mode: 'ranking',
    sort_by: 'score',
    sort_order: 'desc'
  };

  const finalConfig = { ...defaultConfig, ...config };
  // ... pipeline continues ...
}
```

Key idea: one function orchestrates all phases so controller logic stays clean.

## 3. Step 1: Data Enrichment

For each product, the algorithm computes:
- `distance_km` using Haversine
- shelf-life metrics (`remaining_shelf_life_days`, `freshness_percent`, `expiration_date`, `is_expired`)

```js
const enrichedProducts = products.map(product => {
  const enriched = { ...product };

  if (product.location && product.location.lat != null && product.location.lng != null) {
    enriched.distance_km = calculateDistance(
      { lat: buyer.latitude, lng: buyer.longitude },
      { lat: product.location.lat, lng: product.location.lng }
    );
  }

  if (product.total_shelf_life_days != null &&
      product.days_already_used != null &&
      product.listed_date) {
    const shelfLife = calculateShelfLifeMetrics(product);
    enriched.remaining_shelf_life_days = shelfLife.remaining_shelf_life_days;
    enriched.freshness_percent = shelfLife.freshness_percent;
    enriched.expiration_date = shelfLife.expiration_date;
    enriched.is_expired = shelfLife.is_expired;
  }

  return enriched;
});
```

### 3.1 Distance Formula (Haversine)

Module: `server/algorithm/calculations/haversine.js`

```js
function calculateDistance(point1, point2, unit = 'km') {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLngRad = toRadians(point2.lng - point1.lng);

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // km
}
```

### 3.2 Shelf-Life Metrics

Module: `server/algorithm/calculations/shelf-life.js`

```js
function calculateShelfLifeMetrics(product, currentDate = new Date()) {
  const remainingDays = calculateRemainingShelfLife(
    product.total_shelf_life_days,
    product.days_already_used
  );

  const freshnessPercent = calculateFreshnessPercent(
    product.total_shelf_life_days,
    product.days_already_used
  );

  const expirationDate = calculateExpirationDate(product.listed_date, remainingDays);
  const expired = isExpired(expirationDate, currentDate);

  return {
    remaining_shelf_life_days: remainingDays,
    freshness_percent: freshnessPercent,
    expiration_date: expirationDate,
    expiration_date_iso: expirationDate.toISOString(),
    is_expired: expired
  };
}
```

## 4. Step 2: Filtering

Module: `server/algorithm/product-display/product_filter.js`

The filter pipeline can remove products by:
- expiration state
- distance radius
- minimum freshness threshold

```js
function applyFilters(products, filterConfig = {}) {
  const config = {
    filterExpired: filterConfig.filterExpired !== false,
    maxRadiusKm: filterConfig.maxRadiusKm || null,
    minFreshnessPercent: filterConfig.minFreshnessPercent || null,
    currentDate: filterConfig.currentDate || new Date()
  };

  let filtered = [...products];

  if (config.filterExpired) {
    filtered = filterExpiredProducts(filtered, config.currentDate);
  }

  if (config.maxRadiusKm !== null) {
    filtered = filterByProximity(filtered, config.maxRadiusKm);
  }

  if (config.minFreshnessPercent !== null) {
    filtered = filterByFreshness(filtered, config.minFreshnessPercent);
  }

  return { filtered };
}
```

## 5. Step 3: Scoring and Ranking

Module: `server/algorithm/ranking/product_ranker.js`

Each product gets:
- normalized `proximity_score`
- normalized `freshness_score`
- final `combined_score`

```js
const scoredProducts = calculateCombinedScoresBatch(
  productsWithScores,
  proximityWeight,
  freshnessWeight,
  { strict: true }
);

const rankedProducts = scoredProducts.sort((a, b) =>
  b.combined_score - a.combined_score
);
```

### 5.1 Combined Score Formula

Module: `server/algorithm/scoring/combined-score.js`

```js
function calculateCombinedScore(
  proximity_score,
  freshness_score,
  proximity_weight,
  freshness_weight,
  options = {}
) {
  const combined = (proximity_weight * proximity_score + freshness_weight * freshness_score) / 100;
  return Number(combined.toFixed(2));
}
```

Interpretation:
- Higher proximity score means nearer products
- Higher freshness score means longer remaining shelf life
- Weights decide which matters more

## 6. Step 4: Output + Metadata

The algorithm returns both products and runtime metadata:

```js
return {
  products: finalProducts,
  metadata: {
    execution_time_ms: executionTime,
    stats: stats,
    config: finalConfig
  }
};
```

This helps with debugging, analytics, and performance tracking.

## 7. How Controller Uses the Algorithm

Controller: `server/controllers/searchController.js`

```js
const products = await Product.getProductsWithMetrics(buyerLocation, filters);

const buyer = {
  latitude: buyerLocation.lat,
  longitude: buyerLocation.lng,
  preferences: {
    max_radius: config.max_radius
  }
};

const algorithmResult = chendaAlgorithm(buyer, products, config);
```

Pipeline from API request:
1. Validate request location and config
2. Query products from DB
3. Run algorithm
4. Return ranked results to frontend

## 8. Example Configurations

Balanced ranking:
```js
{
  mode: 'ranking',
  max_radius: 30,
  min_freshness_score: 40,
  weights: {
    proximity_weight: 0.5,
    freshness_weight: 0.5
  }
}
```

Distance-priority ranking:
```js
{
  mode: 'ranking',
  max_radius: 20,
  weights: {
    proximity_weight: 0.8,
    freshness_weight: 0.2
  }
}
```

Freshness-priority ranking:
```js
{
  mode: 'ranking',
  max_radius: 50,
  weights: {
    proximity_weight: 0.3,
    freshness_weight: 0.7
  }
}
```

## 9. Why This Design Works

- Modular: each file has one clear responsibility
- Configurable: same pipeline supports different buyer preferences
- Explainable: returns score components and metadata
- Extensible: you can add price, seller reputation, or demand as new score terms later

## 10. Quick Recap (One-Liner)

Chenda ranks perishable products by enriching product data with distance and shelf-life metrics, filtering by buyer constraints, and computing a weighted combined score to return the most suitable items first.
