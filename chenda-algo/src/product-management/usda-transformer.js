/**
 * USDA FoodKeeper Data Transformer
 * Extracts and transforms shelf life data into product_types format
 * 
 * Configuration:
 * - Storage condition: Smart fallback (DOP_Refrigerate → Refrigerate → DOP_Pantry → Pantry → Freeze)
 * - Shelf life value: AVERAGE(min, max)
 */

// Metric conversion to days
const METRIC_TO_DAYS = {
  'Days': 1,
  'Day': 1,
  'Weeks': 7,
  'Week': 7,
  'Months': 30,
  'Month': 30,
  'Years': 365,
  'Year': 365
};

/**
 * Convert shelf life value to days
 */
function convertToDays(value, metric) {
  if (!value || !metric) return null;
  
  const multiplier = METRIC_TO_DAYS[metric] || METRIC_TO_DAYS[metric + 's'] || null;
  if (!multiplier) {
    console.warn(`Unknown metric: ${metric}`);
    return null;
  }
  
  return Math.round(value * multiplier);
}

/**
 * Calculate average shelf life in days from min/max values
 */
function calculateAverageShelfLife(min, max, metric) {
  const minDays = convertToDays(min, metric);
  const maxDays = convertToDays(max, metric);
  
  if (minDays === null && maxDays === null) return null;
  if (minDays === null) return maxDays;
  if (maxDays === null) return minDays;
  
  return Math.round((minDays + maxDays) / 2);
}

/**
 * Extract shelf life using fallback chain
 * Priority: DOP_Refrigerate → Refrigerate → DOP_Pantry → Pantry → DOP_Freeze → Freeze
 */
function extractShelfLife(productData) {
  // Convert array format to object for easier access
  const product = {};
  productData.forEach(item => {
    const key = Object.keys(item)[0];
    product[key] = item[key];
  });
  
  // Define fallback chain with storage condition names
  const fallbackChain = [
    {
      condition: 'refrigerated_opened',
      min: 'DOP_Refrigerate_Min',
      max: 'DOP_Refrigerate_Max',
      metric: 'DOP_Refrigerate_Metric'
    },
    {
      condition: 'refrigerated',
      min: 'Refrigerate_Min',
      max: 'Refrigerate_Max',
      metric: 'Refrigerate_Metric'
    },
    {
      condition: 'pantry_opened',
      min: 'DOP_Pantry_Min',
      max: 'DOP_Pantry_Max',
      metric: 'DOP_Pantry_Metric'
    },
    {
      condition: 'pantry',
      min: 'Pantry_Min',
      max: 'Pantry_Max',
      metric: 'Pantry_Metric'
    },
    {
      condition: 'frozen_opened',
      min: 'DOP_Freeze_Min',
      max: 'DOP_Freeze_Max',
      metric: 'DOP_Freeze_Metric'
    },
    {
      condition: 'frozen',
      min: 'Freeze_Min',
      max: 'Freeze_Max',
      metric: 'Freeze_Metric'
    }
  ];
  
  // Try each condition in priority order
  for (const fb of fallbackChain) {
    const shelfLifeDays = calculateAverageShelfLife(
      product[fb.min],
      product[fb.max],
      product[fb.metric]
    );
    
    if (shelfLifeDays !== null) {
      return {
        shelf_life_days: shelfLifeDays,
        storage_condition: fb.condition,
        source: {
          min: product[fb.min],
          max: product[fb.max],
          metric: product[fb.metric]
        }
      };
    }
  }
  
  return null;
}

/**
 * Transform USDA product data to product_types format
 */
function transformProductTypes(usdaProducts) {
  const productTypes = [];
  let skippedCount = 0;
  
  usdaProducts.forEach((productData, index) => {
    // Convert array format to object
    const product = {};
    productData.forEach(item => {
      const key = Object.keys(item)[0];
      product[key] = item[key];
    });
    
    // Extract shelf life with fallback
    const shelfLifeData = extractShelfLife(productData);
    
    if (!shelfLifeData) {
      skippedCount++;
      console.warn(`Skipped product ID ${product.ID}: No shelf life data available`);
      return;
    }
    
    // Create product type object
    const productType = {
      id: product.ID,
      name: product.Name,
      name_subtitle: product.Name_subtitle,
      category_id: product.Category_ID,
      keywords: product.Keywords,
      default_shelf_life_days: shelfLifeData.shelf_life_days,
      default_storage_condition: shelfLifeData.storage_condition,
      shelf_life_source: shelfLifeData.source
    };
    
    productTypes.push(productType);
  });
  
  console.log(`\nTransformation Summary:`);
  console.log(`- Total products processed: ${usdaProducts.length}`);
  console.log(`- Successfully transformed: ${productTypes.length}`);
  console.log(`- Skipped (no shelf life data): ${skippedCount}`);
  
  return productTypes;
}

/**
 * Example usage with sample data
 */
function exampleUsage() {
  // Sample Butter product from USDA (from your provided structure)
  const sampleButter = [
    { "ID": 1.0 },
    { "Category_ID": 7.0 },
    { "Name": "Butter" },
    { "Name_subtitle": null },
    { "Keywords": "Butter" },
    { "Pantry_Min": null },
    { "Pantry_Max": null },
    { "Pantry_Metric": null },
    { "Pantry_tips": "May be left at room temperature for 1 - 2 days." },
    { "DOP_Pantry_Min": null },
    { "DOP_Pantry_Max": null },
    { "DOP_Pantry_Metric": null },
    { "DOP_Pantry_tips": null },
    { "Pantry_After_Opening_Min": null },
    { "Pantry_After_Opening_Max": null },
    { "Pantry_After_Opening_Metric": null },
    { "Refrigerate_Min": null },
    { "Refrigerate_Max": null },
    { "Refrigerate_Metric": null },
    { "Refrigerate_tips": null },
    { "DOP_Refrigerate_Min": 1.0 },
    { "DOP_Refrigerate_Max": 2.0 },
    { "DOP_Refrigerate_Metric": "Months" },
    { "DOP_Refrigerate_tips": null },
    { "Refrigerate_After_Opening_Min": null },
    { "Refrigerate_After_Opening_Max": null },
    { "Refrigerate_After_Opening_Metric": null },
    { "Refrigerate_After_Thawing_Min": null },
    { "Refrigerate_After_Thawing_Max": null },
    { "Refrigerate_After_Thawing_Metric": null },
    { "Freeze_Min": null },
    { "Freeze_Max": null },
    { "Freeze_Metric": null },
    { "Freeze_Tips": null },
    { "DOP_Freeze_Min": 6.0 },
    { "DOP_Freeze_Max": 9.0 },
    { "DOP_Freeze_Metric": "Months" },
    { "DOP_Freeze_Tips": null }
  ];
  
  console.log("=== USDA Data Transformer Example ===\n");
  
  // Transform single product
  const transformed = transformProductTypes([sampleButter]);
  
  console.log("\nTransformed Product Type:");
  console.log(JSON.stringify(transformed[0], null, 2));
}

// Export functions for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertToDays,
    calculateAverageShelfLife,
    extractShelfLife,
    transformProductTypes
  };
}

// Run example if executed directly
if (require.main === module) {
  exampleUsage();
}
