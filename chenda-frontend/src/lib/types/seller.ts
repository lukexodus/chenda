/**
 * Types for seller-related components
 */

export interface ProductType {
  id: number;
  name: string;
  name_subtitle?: string | null;
  category_id: number;
  keywords?: string;
  default_shelf_life_days: number;
  default_storage_condition: string;
  /** 'usda' | 'regional' | 'custom' */
  source?: string;
  /** Running average of all seller overrides (populated when ≥3 overrides exist) */
  community_avg_shelf_life_days?: number | null;
  community_override_count?: number;
  /** Canonical representative photo populated by seed.js from the image manifest */
  image_url?: string | null;
}

export interface SellerProduct {
  id: number;
  name?: string;
  name_subtitle?: string;
  seller_id: number;
  product_type_id: number;
  /** Seller-entered shelf life for this specific listing */
  seller_shelf_life_days?: number;
  price: number;
  quantity: number;
  unit: string;
  days_already_used: number;
  total_shelf_life_days?: number;
  listed_date: string;
  image_url?: string;
  description?: string;
  status: string;
  storage_condition: string;
  location?: {
    lat: number;
    lng: number;
  };
  created_at: string;
  updated_at: string;
  product_type?: {
    id: number;
    name: string;
    name_subtitle?: string;
    default_shelf_life_days: number;
    source?: string;
  };
}

export interface SellerAnalytics {
  total_products: number;
  active_products: number;
  average_freshness: number;
  expiring_soon: number;
  total_revenue?: number;
  total_orders?: number;
}

export interface ProductFormData {
  /** Path A: existing catalog type */
  product_type_id?: number;
  /** Path B: custom product not in catalog */
  custom_product_name?: string;
  custom_shelf_life_days?: number;
  /** Authoritative shelf life chosen by seller (required) */
  seller_shelf_life_days: number;
  price: number;
  quantity: number;
  unit: string;
  days_already_used: number;
  description?: string;
  image_url?: string;
  storage_condition?: string;
}
