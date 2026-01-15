
import { SupabaseClient } from '@supabase/supabase-js'

export interface B2BApplicationData {
  company_name: string
  tax_id: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

export class B2BService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get B2B client profile by user ID
   */
  async getClientByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from('b2b_clients')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Submit a new B2B application
   * This creates a client record with is_active = false
   */
  async applyForB2B(userId: string, data: B2BApplicationData) {
    const { data: client, error } = await this.supabase
      .from('b2b_clients')
      .insert({
        user_id: userId,
        ...data,
        is_active: false, // Must be approved by admin
        credit_limit: 0,
        discount_percentage: 0
      })
      .select()
      .single()

    if (error) throw error
    return client
  }

  /**
   * Get all B2B API keys for a client
   */
  async getApiKeys(clientId: string) {
    const { data, error } = await this.supabase
      .from('b2b_api_keys')
      .select('*')
      .eq('b2b_client_id', clientId)
      .eq('is_active', true)

    if (error) throw error
    return data
  }

  /**
   * Get fixed prices for a B2B client
   */
  async getFixedPrices(clientId: string) {
    const { data, error } = await this.supabase
      .from('b2b_product_prices')
      .select('product_id, fixed_price')
      .eq('b2b_client_id', clientId)

    if (error) throw error
    return data || []
  }

  /**
   * Create a new API Key for a B2B client
   * Note: The actual full key should be returned only once here.
   * We store the prefix and the hash.
   */
  async createApiKey(clientId: string, name: string) {
    const prefix = 'clm_'
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const fullKey = `${prefix}${randomPart}`
    
    // In a real scenario, we would use a proper hash function (e.g. crypto.subtle or similar)
    // For this demonstration, we'll store it simply or use a dummy hash logic
    const keyHash = btoa(fullKey) // DUMMY HASH: Use proper hashing in production

    const { error } = await this.supabase
      .from('b2b_api_keys')
      .insert({
        b2b_client_id: clientId,
        name,
        key_prefix: prefix + randomPart.substring(0, 4),
        key_hash: keyHash,
        is_active: true
      })

    if (error) throw error
    
    return fullKey
  }

  /**
   * Validate an API Key
   */
  async validateApiKey(apiKey: string) {
    const keyHash = btoa(apiKey) // Must match the hashing logic above

    const { data, error } = await this.supabase
      .from('b2b_api_keys')
      .select('*, b2b_clients(*)')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error) return null

    // Update last used at
    await this.supabase
      .from('b2b_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)

    return data.b2b_clients
  }
}
