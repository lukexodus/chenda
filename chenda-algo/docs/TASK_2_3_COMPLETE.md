# Task 2.3 Complete: Score Normalization

## ✅ Implementation Summary

**Task**: Implement score normalization (proximity and freshness → 0-100 scores)  
**Status**: Complete  
**Files Created**:
- `score_normalizer.js` - Core implementation with 4 functions
- `score_normalizer_integration_test.js` - Integration tests with mock data

---

## 🎯 Features Implemented

### Core Functions

✓ **normalizeProximityScore()** - Distance (km) → 0-100 score (inverse linear)  
✓ **normalizeFreshnessScore()** - Freshness % → 0-100 score (pass-through)  
✓ **normalizeScores()** - Normalize both metrics together (convenience)  
✓ **normalizeScoresBatch()** - Batch processing for multiple products  

---

## 📊 Test Results

### Unit Tests (14 tests)
✓ Proximity: 0 km distance → 100 score  
✓ Proximity: Halfway distance → 50 score  
✓ Proximity: Max radius distance → 0 score  
✓ Proximity: Beyond max radius → 0 score  
✓ Proximity: 10% of max radius → 90 score  
✓ Freshness: 100% fresh → 100 score  
✓ Freshness: 82.14% fresh → 82.14 score  
✓ Freshness: 10% fresh → 10 score  
✓ Normalize both scores together  
✓ Normalize batch of products  
✓ Error: Negative distance throws error  
✓ Error: Freshness > 100 throws error  
✓ Error: Zero max_radius throws error  
✓ Decimal precision control  

### Integration Tests (7 scenarios)
✓ **Scenario 1**: Buyer product search with normalized scores (30 products)  
✓ **Scenario 2**: Score distribution analysis (proximity & freshness)  
✓ **Scenario 3**: Max radius impact on proximity scores  
✓ **Scenario 4**: Top 5 products by score type  
✓ **Scenario 5**: Balance analysis (products with both high scores)  
✓ **Scenario 6**: Multi-buyer score comparison  
✓ **Scenario 7**: Performance test (30 products in 0ms)  

---

## 📈 Real Data Insights (Mock Data Analysis)

### Score Distribution Statistics
- **Total products analyzed**: 30
- **Average proximity score**: 80.00/100
- **Average freshness score**: 74.08/100
- **Products with both scores ≥70**: 15 (50.0%)

### Proximity Score Distribution
```
90-100 (Excellent):   16.7% (5 products)  - Very close
70-89 (Good):         50.0% (15 products) - Moderate distance
50-69 (Fair):         33.3% (10 products) - Farther
30-49 (Poor):          0.0% (0 products)  - None (all within range)
0-29 (Very poor):      0.0% (0 products)  - None
```

**Insights**:
- No products scored below 50 (all within reasonable range)
- Half the products are in the "good" range (70-89)
- 16.7% are excellently positioned (≥90 score)

### Freshness Score Distribution
```
90-100 (Excellent):   16.7% (5 products)  - Just opened/very fresh
70-89 (Good):         50.0% (15 products) - Fresh, plenty of time
50-69 (Fair):         30.0% (9 products)  - Acceptable
30-49 (Poor):          3.3% (1 product)   - Near expiration
0-29 (Critical):       0.0% (0 products)  - None
```

**Insights**:
- Distribution mirrors proximity scores
- Only 1 product below 50% (near expiration)
- Most products are in good condition (≥70%)

---

## 🏆 Top Performing Products

### Top 5 by Proximity (Closest to Buyer)
1. **Multiple products** at 1.87 km - Score: 93.77
   - Yogurt, Eggs, Cheese, Cream cheese, Coffee creamer
   - All from Manila Bay Groceries (same location)

### Top 5 by Freshness (Most Fresh)
1. **Kefir** - 100% fresh - Score: 100.00
2. **Yogurt** - 100% fresh - Score: 100.00
3. **Yogurt** - 90.91% fresh - Score: 90.91
4. **Yogurt** - 90.91% fresh - Score: 90.91
5. **Buttermilk** - 90.91% fresh - Score: 90.91

### Balanced Products (Both Proximity ≥70 AND Freshness ≥70)
**15 out of 30 products** achieve both high proximity and high freshness:
- Yogurt (85.87 prox, 90.91 fresh)
- Eggs (85.87 prox, 82.14 fresh)
- Buttermilk (85.87 prox, 81.82 fresh)
- Cottage cheese (85.87 prox, 78.57 fresh)
- Egg dishes (85.87 prox, 75.00 fresh)

---

## ⚖️  Trade-off Analysis

### Products with Trade-offs
- **Close but less fresh** (prox≥80, fresh<60): **4 products**
  - Example: Cream cheese nearby but at 50% freshness
- **Far but very fresh** (prox<40, fresh≥80): **0 products**
  - No products in this category (all are reasonably close)

### Insight
Most products offer a good balance between proximity and freshness. Few require choosing between convenience (close) vs quality (fresh).

---

## 🔍 Normalization Formula Details

### Proximity Score Normalization
```
Formula: score = 100 × (1 - distance_km / max_radius_km)

Examples (max_radius = 30 km):
  0 km   → 100 × (1 - 0/30)  = 100.00
  5 km   → 100 × (1 - 5/30)  = 83.33
  15 km  → 100 × (1 - 15/30) = 50.00
  30 km  → 100 × (1 - 30/30) = 0.00
  35 km  → 0.00 (beyond radius)
```

**Characteristics**:
- Linear inverse relationship
- Closer = higher score
- Products at/beyond max_radius get 0 score
- Score changes proportionally with distance

### Freshness Score Normalization
```
Formula: score = freshness_percent (pass-through)

Examples:
  100% fresh → 100.00 score
  82%  fresh → 82.00 score
  50%  fresh → 50.00 score
  10%  fresh → 10.00 score
```

**Characteristics**:
- Currently 1:1 mapping (already 0-100%)
- Function exists for consistency and future enhancements
- Could apply curves (e.g., exponential penalty near expiration)

---

## 🔄 Impact of Max Radius on Scores

**Sample Product**: Yogurt at 4.24 km from buyer

| Max Radius | Proximity Score | Interpretation |
|-----------|----------------|----------------|
| 20 km     | 78.80          | ✓ Good        |
| 30 km     | 85.87          | ⭐ Excellent   |
| 40 km     | 89.40          | ⭐ Excellent   |
| 50 km     | 91.52          | ⭐ Excellent   |

**Insight**: Same product gets different scores depending on buyer's max_radius preference. Wider search radius = higher scores for all products.

---

## 👥 Multi-Buyer Comparison

**Sample Product**: Yogurt in Taguig (freshness: 81.82%)

| Buyer          | Distance | Max Radius | Proximity Score | Freshness Score |
|---------------|----------|------------|-----------------|-----------------|
| Maria Santos  | 9.91 km  | 30 km      | 66.97          | 81.82          |
| Carlos Reyes  | 3.39 km  | 20 km      | 83.05          | 81.82          |
| Ana Garcia    | 4.89 km  | 50 km      | 90.22          | 81.82          |
| Roberto Cruz  | 18.05 km | 40 km      | 54.87          | 81.82          |
| Sofia Mendoza | 14.73 km | 15 km      | 1.80           | 81.82          |

**Insights**:
- Same product, same freshness, but different proximity scores per buyer
- Scores vary based on both distance AND buyer's max_radius preference
- Sofia gets very low score (1.80) because product is nearly at her limit (14.73/15 km)

---

## 🔗 Integration with Chenda System

### Usage in Search Pipeline
```javascript
// Step 1: Calculate distances (Task 2.1)
const productsWithDistance = products.map(product => ({
  ...product,
  distance_km: calculateDistance(buyer.location, product.location)
}));

// Step 2: Calculate freshness metrics (Task 2.2)
const enrichedProducts = productsWithDistance.map(product => {
  const metrics = calculateShelfLifeMetrics({
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date
  });
  
  return {
    ...product,
    freshness_percent: metrics.freshness_percent
  };
});

// Step 3: Normalize scores (Task 2.3) ✅ NEW
const withScores = normalizeScoresBatch(
  enrichedProducts, 
  buyer.preferences.max_radius_km
);

// Step 4: Calculate combined scores (Task 2.4 - NEXT)
// Step 5: Sort by combined scores
```

---

## ✨ Key Design Decisions

### 1. Linear Normalization for Proximity
**Decision**: Use linear inverse formula (not exponential/logarithmic)  
**Rationale**: Simple, predictable, proportional to distance  
**Alternative considered**: Exponential decay (heavier penalty for far products)  
**Chosen because**: Linear is intuitive for users to understand

### 2. Pass-through for Freshness
**Decision**: Freshness score = freshness percent (1:1 mapping)  
**Rationale**: Already 0-100%, no transformation needed  
**Future option**: Could apply curves (e.g., extra penalty <30%)  
**Benefit**: Function in place for future enhancements

### 3. Max Radius as Boundary
**Decision**: Products at/beyond max_radius get 0 score  
**Rationale**: Enforces buyer's distance preference  
**Alternative considered**: Allow small scores beyond radius  
**Chosen because**: Clear boundary makes filtering easier

### 4. Precision Control
**Decision**: Default 2 decimals (e.g., 82.14)  
**Rationale**: Balance between accuracy and readability  
**Configurable**: decimals parameter available if needed

### 5. Batch Processing
**Decision**: Provide batch function for arrays  
**Rationale**: Performance optimization + cleaner code  
**Use case**: Normalize entire product catalog at once

---

## 📦 Exports

```javascript
module.exports = {
  normalizeProximityScore,    // Distance → score
  normalizeFreshnessScore,    // Freshness → score
  normalizeScores,            // Both together
  normalizeScoresBatch        // Batch processing
};
```

---

## 🧪 Usage Examples

### Example 1: Basic Normalization
```javascript
// Proximity
const proxScore = normalizeProximityScore(10, 50); // 80.00

// Freshness
const freshScore = normalizeFreshnessScore(82.14); // 82.14

// Both together
const scores = normalizeScores({
  distance_km: 10,
  freshness_percent: 82.14,
  max_radius_km: 50
});
// { proximity_score: 80.00, freshness_score: 82.14 }
```

### Example 2: Batch Processing
```javascript
const products = [
  { id: 1, distance_km: 5, freshness_percent: 90 },
  { id: 2, distance_km: 15, freshness_percent: 75 }
];

const withScores = normalizeScoresBatch(products, 50);
// [
//   { id: 1, distance_km: 5, freshness_percent: 90, 
//     proximity_score: 90.00, freshness_score: 90.00 },
//   { id: 2, distance_km: 15, freshness_percent: 75,
//     proximity_score: 70.00, freshness_score: 75.00 }
// ]
```

### Example 3: Finding Balanced Products
```javascript
const balanced = withScores.filter(p => 
  p.proximity_score >= 70 && p.freshness_score >= 70
);
console.log(`${balanced.length} products with both high scores`);
```

---

## ✅ Acceptance Criteria Met

✓ **Normalizes proximity** to 0-100 scale (closer = higher)  
✓ **Normalizes freshness** to 0-100 scale (fresher = higher)  
✓ **Handles edge cases** (0 km, max radius, beyond radius)  
✓ **Provides batch processing** for efficiency  
✓ **Validates inputs** with descriptive errors  
✓ **Well documented** (JSDoc comments, examples, tests)  
✓ **Integrated with mock data** (works with existing system)  
✓ **Performance tested** (30 products in <1ms)  

---

## 🎓 Technical Notes

### Why Normalize?
Different metrics have different scales:
- Distance: 0-50 km (varies with radius)
- Freshness: 0-100%

Normalization converts both to **comparable 0-100 scales**, enabling:
1. Fair comparison
2. Weighted combination (Task 2.4)
3. User-adjustable priorities

### Alternative Normalization Approaches

**Linear (Current)**:
- Formula: `score = 100 × (1 - distance/max)`
- Pro: Simple, predictable, proportional
- Con: Equal weight to all distance changes

**Exponential**:
- Formula: `score = 100 × e^(-k × distance/max)`
- Pro: Heavily favor nearby products
- Con: Complex, less intuitive

**Logarithmic**:
- Formula: `score = 100 × (1 - log(distance+1)/log(max+1))`
- Pro: Reduces impact of far products
- Con: Diminishing returns not always desired

**Chosen**: Linear for MVP (simple, intuitive). Can enhance later based on user feedback.

---

## ⚡ Performance

- **Time complexity**: O(1) per normalization
- **Space complexity**: O(1)
- **Batch processing**: O(n) for n products
- **Measured performance**: 30 products in 0ms

---

## 🚀 Next Steps (Phase 2 Completion)

**Completed**: 
- Task 2.1: Haversine Distance Calculator ✓
- Task 2.2: Shelf Life Calculator ✓
- Task 2.3: Score Normalization ✓ **[Current]**

**Next**: 
- **Task 2.4: Combined Score Calculator** - Weighted sum of proximity and freshness scores

**Dependencies for Task 2.4**:
- Need user preferences: proximity_weight, freshness_weight (already in mock data ✓)
- Need normalized scores: proximity_score, freshness_score (implemented ✓)
- Formula: `combined_score = (proximity_weight × proximity_score + freshness_weight × freshness_score) / 100`

---

## 💡 Insights for Next Phase

### Phase 3 (Filtering Logic)
Normalized scores make filtering easier:
- Filter products with proximity_score < threshold
- Filter products with freshness_score < threshold
- Combine filters as needed

### Phase 4 (Scoring & Ranking)
Ready for weighted combination:
- Proximity weight: 0-100% (user preference)
- Freshness weight: 0-100% (user preference)
- Combined score uses normalized values (no bias)

### Phase 5 (Sorting & Display)
Two display modes will use these scores:
1. **Ranking mode**: Sort by combined_score
2. **Filter+sort mode**: Apply filters, then sort by price/distance/freshness

---

**Status**: Task 2.3 Complete ✅  
**Generated**: 2025-02-06  
**Integration**: Works seamlessly with Tasks 2.1 & 2.2  
**Ready for**: Task 2.4 - Combined Score Calculator (final Phase 2 task)
