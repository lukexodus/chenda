# **Big O Complexity Analysis — Core Proximity & Shelf-Life Algorithms**

**Symbol:** n \= number of products in a batch

---

## **Summary Table**

| Algorithm / Function | Location | Best Case | Average Case | Worst Case | Space |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Haversine distance for one buyer-product pair: `calculateDistance` | haversine.js | O(1) | O(1) | O(1) | O(1) |
| Batch proximity distance calculation: `calculateDistanceBatch` | haversine.js | O(n) | O(n) | O(n) | O(n) |
| Shelf-life metrics for one product: `calculateShelfLifeMetrics` | shelf-life.js | O(1) | O(1) | O(1) | O(1) |
| Batch shelf-life enrichment: `calculateShelfLifeMetricsBatch` | shelf-life.js | O(n) | O(n) | O(n) | O(n) |
| Expired-product filtering: `filterExpiredProducts` | shelf-life.js | O(n) | O(n) | O(n) | O(n) |
| Freshness-threshold filtering: `filterByFreshness` | shelf-life.js | O(n) | O(n) | O(n) | O(n) |

---

## **Key Takeaway**

The core per-item computations — `calculateDistance` and `calculateShelfLifeMetrics` — are both **O(1)** when applied to a single product. The moment either is applied across a product list, the complexity scales **linearly to O(n)**, where n is the number of products in the batch.

# **Big O Complexity Analysis — CHENDA System**

**Symbols:**

* **n** \= products entering a backend pipeline  
* **m** \= products after filtering  
* **r** \= client-side search results  
* **p** \= USDA records  
* **f** \= fields per USDA record  
* **k** \= weight configurations  
* **t** \= product types in the combobox  
* **a** \= active seller products  
* **u** \= unique seller product types  
* **c** \= geocode cache entries

---

## **Summary Table**

| Algorithm / Function | Location | Best Case | Average Case | Worst Case | Space |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Constant-time helpers *(Haversine single distance, shelf-life single-item, score normalization, weighted-score calculation, config/weight validation)* | haversine.js, shelf-life.js, score-normalizer.js, combined-score.js, chenda\_algorithm.js | O(1) | O(1) | O(1) | O(1) |
| `calculateDistanceBatch` | haversine.js | O(n) | O(n) | O(n) | O(n) |
| `calculateShelfLifeMetricsBatch` | shelf-life.js | O(n) | O(n) | O(n) | O(n) |
| `filterExpiredProducts`, `filterByFreshness` | shelf-life.js | O(n) | O(n) | O(n) | O(n) |
| `filterByProximity` | product\_filter.js | O(n) | O(n) | O(n) | O(n) |
| `applyFilters`, `filterForBuyer` | product\_filter.js | O(n) | O(n) | O(n) | O(n) |
| `normalizeScoresBatch` | score-normalizer.js | O(n) | O(n) | O(n) | O(n) |
| `calculateCombinedScoresBatch` | combined-score.js | O(n) | O(n) | O(n) | O(n) |
| Comparison-sort routines: `sortByCombinedScore`, `rankByScore`, `sortProducts`, buyer-page result sort, seller product-table sort | combined-score.js, product\_ranker.js, product\_sorter.js, buyer/page.tsx, ProductTable.tsx | O(n) | O(n log n) | O(n log n) | O(n) |
| `scoreAndRankProducts` | product\_ranker.js | O(n) | O(n log n) | O(n log n) | O(n) |
| `addRankPositions`, `getTopProducts` | product\_ranker.js | O(n) | O(n log n) | O(n log n) | O(n) |
| `getRankingStatistics` | product\_ranker.js | O(1) if empty, else O(n) | O(n log n) | O(n log n) | O(n) |
| `compareWeightConfigs` | product\_ranker.js | O(k·n) | O(k·n log n) | O(k·n log n) | O(k·n) |
| `filterAndSortMode` | product\_sorter.js | O(n) | O(n log n) | O(n log n) | O(n) |
| `displayProducts` | product\_sorter.js | O(n) | O(n log n) | O(n log n) | O(n) |
| `chendaAlgorithm` *(full backend pipeline)* | chenda\_algorithm.js | O(n) | O(n log n) | O(n log n) | O(n) |
| Convenience wrappers: `quickSearch`, `searchByPrice`, `searchByDistance`, `searchByFreshness` | chenda\_algorithm.js | O(n) | O(n log n) | O(n log n) | O(n) |
| `extractShelfLife` *(single USDA record)* | usda-transformer.js | O(f) | O(f) | O(f) | O(f) |
| `transformProductTypes` *(all USDA records)* | usda-transformer.js | O(p·f) | O(p·f) | O(p·f) | O(p \+ f) |
| `geocodeAddress`, `reverseGeocode` | geocodingService.js | O(1) | O(1) expected | O(c) pathological | O(c) |
| `getCacheStats`, `clearCache` | geocodingService.js | O(c) | O(c) | O(c) | O(c) |
| `Product.getProductsWithMetrics` row mapping | Product.js | O(r) | O(r) | O(r) | O(r) |
| Search-store rank assignment | searchStore.ts | O(r) | O(r) | O(r) | O(r) |
| Product-type combobox filtering | ProductTypeCombobox.tsx | O(1) if blank | O(t) | O(t) | O(t) |
| Seller analytics aggregation | SellerAnalytics.tsx | O(a) | O(a \+ u log u) | O(a log a) | O(u) |

---

## **Key Takeaways**

**1\. Sorting is the dominant cost.** Most of the pipeline is linear O(n), but ranking and user-facing re-sorting bring the end-to-end average and worst case to **O(n log n)**.

**2\. The backend pipeline is cleanly composed and asymptotically efficient.** `chendaAlgorithm` in chenda\_algorithm.js follows this breakdown:

| Step | Complexity |
| ----- | ----- |
| Enrichment | O(n) |
| Filtering | O(n) |
| Scoring | O(n) |
| **Sorting** *(dominant)* | **O(n log n)** |

**3\. The standalone algorithm package mirrors the backend.** The chenda\_algorithm.js standalone package has identical asymptotics to the production backend modules.

**4\. Two areas to watch for practical performance:**

* `usda-transformer.js` — rebuilds each USDA record into an object more than once.  
* `SellerAnalytics.tsx` — performs multiple separate passes over the same product list.

---

## **Scope Caveat**

The exact Big O for the **SQL/PostGIS layer** — particularly `ST_DWithin`, `ST_Distance`, GiST/GIN index usage, and materialized-view refresh behavior — cannot be reliably derived from the JavaScript codebase alone, as it depends on PostgreSQL planner decisions and index availability at runtime.

# **Pseudocode of the Core Algorithms**

## **Algorithm 1: Haversine Proximity Calculation**

| INPUT:  buyer\_lat, buyer\_lng  product\_lat, product\_lngOUTPUT:  distance\_kmBEGIN  IF buyer and product locations are the same    RETURN 0  ENDIF  Convert buyer\_lat, buyer\_lng, product\_lat, product\_lng from degrees to radians  delta\_lat \= product\_lat \- buyer\_lat  delta\_lng \= product\_lng \- buyer\_lng  a \= sin²(delta\_lat / 2\) \+      cos(buyer\_lat) \* cos(product\_lat) \* sin²(delta\_lng / 2\)  c \= 2 \* atan2(sqrt(a), sqrt(1 \- a))  distance\_km \= Earth\_Radius\_KM \* c  RETURN distance\_kmEND |
| :---- |

## **Algorithm 2: Shelf-Life Metrics Computation**

| INPUT:  total\_shelf\_life\_days  days\_already\_used  listed\_date  current\_dateOUTPUT:  remaining\_shelf\_life\_days  freshness\_percent  expiration\_date  is\_expiredBEGIN  remaining\_shelf\_life\_days \= total\_shelf\_life\_days \- days\_already\_used  freshness\_percent \= (remaining\_shelf\_life\_days / total\_shelf\_life\_days) \* 100  expiration\_date \= listed\_date \+ remaining\_shelf\_life\_days  IF current\_date \> expiration\_date    is\_expired \= TRUE  ELSE    is\_expired \= FALSE  ENDIF  RETURN remaining\_shelf\_life\_days,         freshness\_percent,         expiration\_date,         is\_expiredEND |
| :---- |

