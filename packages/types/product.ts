export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  translations?: Record<string, {
    name?: string;
    description?: string;
  }>;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  short_description?: string;
  base_price: number;
  cost_price?: number;
  is_active: boolean;
  is_featured: boolean;
  weight_grams: number;
  requires_refrigeration: boolean;
  meta_title?: string;
  meta_description?: string;
  image_url?: string;
  discount_percentage?: number;
  translations?: Record<string, {
    name?: string;
    description?: string;
    short_description?: string;
    meta_title?: string;
    meta_description?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  flavor?: string;
  size?: string;
  price_modifier: number;
  created_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  reserved_quantity: number;
  warehouse_location?: string;
  last_restocked_at?: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  categories?: Category[];
  variants?: ProductVariant[];
  inventory?: Inventory[];
}
