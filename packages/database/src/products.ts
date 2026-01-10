import { SupabaseClient } from '@supabase/supabase-js'
import { Product, ProductWithDetails, Category } from '@calmar/types'

export class ProductService {
  constructor(private supabase: SupabaseClient) {}

  async getProducts(options: { activeOnly?: boolean; featuredOnly?: boolean; locale?: string } = {}) {
    let query = this.supabase
      .from('products')
      .select('*, product_variants(*), inventory(*), product_categories(categories(*))')

    if (options.activeOnly) {
      query = query.eq('is_active', true)
    }

    if (options.featuredOnly) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error in getProducts query:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    
    if (!data) return []
    
    const products = data as any[]
    return products.map(p => this.mapProduct(p, options.locale || 'es'))
  }

  async getProductBySku(sku: string, locale?: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, product_variants(*), inventory(*), product_categories(categories(*))')
      .eq('sku', sku)
      .single()

    if (error) throw error
    return this.mapProduct(data, locale || 'es')
  }

  private mapProduct(product: any, locale: string): ProductWithDetails {
    // Flatten categories from junction table
    const categories = product.product_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    
    // Flatten inventory if it was fetched as an array
    const inventory = Array.isArray(product.inventory) ? product.inventory : (product.inventory ? [product.inventory] : []);

    const translation = product.translations?.[locale]
    
    return {
      ...product,
      categories,
      inventory,
      variants: product.product_variants || [],
      name: translation?.name || product.name,
      description: translation?.description || product.description,
      short_description: translation?.short_description || product.short_description,
      meta_title: translation?.meta_title || product.meta_title,
      meta_description: translation?.meta_description || product.meta_description
    } as ProductWithDetails
  }

  async createProduct(product: Partial<Product>) {
    const { data, error } = await this.supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data as Product
  }

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await this.supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Product
  }

  async getCategories(locale?: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    const categories = data as Category[]

    if (locale && locale !== 'es') {
      return categories.map(c => {
        const trans = c.translations?.[locale]
        if (!trans) return c
        return {
          ...c,
          name: trans.name || c.name,
          description: trans.description || c.description
        }
      })
    }

    return categories
  }
}
