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
}

export interface SellerProduct {
  id: number;
  name: string;
  name_subtitle?: string;
  seller_id: number;
  product_type_id: number;
  price: number;
  quantity: number;
  unit: string;
  days_already_used: number;
  total_shelf_life_days: number;
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
  product_type_id: number;
  price: number;
  quantity: number;
  unit: string;
  days_already_used: number;
  description?: string;
  image_url?: string;
  storage_condition?: string;
}
