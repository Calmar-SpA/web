import { SupabaseClient } from '@supabase/supabase-js'

export interface ProspectData {
  type: 'b2b' | 'b2c'
  stage?: 'contact' | 'interested' | 'sample_sent' | 'negotiation' | 'converted' | 'lost'
  user_id?: string | null
  company_name?: string
  contact_name?: string
  contact_role?: string
  email?: string
  phone?: string
  tax_id?: string
  address?: string
  city?: string
  comuna?: string
  business_activity?: string
  requesting_rut?: string
  shipping_address?: string
  notes?: string
  credit_limit?: number
  payment_terms_days?: number
  is_b2b_active?: boolean
  b2b_approved_at?: string | null
}

export interface ProspectInteractionData {
  prospect_id: string
  interaction_type: 'call' | 'email' | 'meeting' | 'note' | 'sample_sent' | 'quote_sent' | 'other'
  subject?: string
  notes: string
}

export interface ProspectProductPriceInput {
  product_id: string
  fixed_price: number
}

export interface ProductMovementItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  unit_price: number
}

export interface ProductMovementData {
  movement_type: 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit'
  prospect_id?: string | null
  customer_user_id?: string | null
  items: ProductMovementItem[]
  total_amount: number
  due_date?: string | null
  delivery_date?: string | null
  notes?: string | null
  // Fields for anonymous samples (events, fairs, etc.)
  sample_recipient_name?: string | null
  sample_event_context?: string | null
}

export interface MovementPaymentData {
  movement_id: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'check' | 'credit_card' | 'other'
  payment_reference?: string
  notes?: string
}

export class CRMService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all prospects with optional filters
   */
  async getProspects(filters?: {
    type?: 'b2b' | 'b2c'
    stage?: string
    search?: string
  }) {
    let query = this.supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.stage) {
      query = query.eq('stage', filters.stage)
    }

    if (filters?.search) {
      query = query.or(
        `contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Get a single prospect by ID
   */
  async getProspectById(id: string) {
    const { data, error } = await this.supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get a single prospect by user ID
   */
  async getProspectByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from('prospects')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Create a new prospect
   */
  async createProspect(data: ProspectData) {
    const { data: prospect, error } = await this.supabase
      .from('prospects')
      .insert({
        ...data,
        stage: data.stage || 'contact'
      })
      .select()
      .single()

    if (error) throw error
    return prospect
  }

  /**
   * Update prospect stage
   */
  async updateProspectStage(id: string, stage: string) {
    const { data, error } = await this.supabase
      .from('prospects')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update prospect data
   */
  async updateProspect(id: string, updates: Partial<ProspectData>) {
    const { data, error } = await this.supabase
      .from('prospects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Convert prospect to client
   */
  async convertProspectToClient(
    prospectId: string,
    clientId: string,
    clientType: 'b2b' | 'b2c'
  ) {
    const { data, error } = await this.supabase
      .from('prospects')
      .update({
        stage: 'converted',
        converted_to_client_id: clientId,
        converted_to_type: clientType,
        updated_at: new Date().toISOString()
      })
      .eq('id', prospectId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get interactions for a prospect
   */
  async getProspectInteractions(prospectId: string) {
    const { data, error } = await this.supabase
      .from('prospect_interactions')
      .select('*, created_by:users(id, email, full_name)')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get web orders linked to a prospect
   */
  async getProspectOrders(prospectId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Create a new interaction
   */
  async createInteraction(data: ProspectInteractionData) {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    const { data: interaction, error } = await this.supabase
      .from('prospect_interactions')
      .insert({
        ...data,
        created_by: user?.id
      })
      .select()
      .single()

    if (error) throw error
    return interaction
  }

  /**
   * Get all product movements with optional filters
   */
  async getMovements(filters?: {
    movement_type?: string
    status?: string
    prospect_id?: string
    customer_user_id?: string
    overdue_only?: boolean
  }) {
    let query = this.supabase
      .from('product_movements')
      .select(`
        *,
        prospect:prospects(id, contact_name, company_name, email),
        customer:users!customer_user_id(id, email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.movement_type) {
      query = query.eq('movement_type', filters.movement_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.prospect_id) {
      query = query.eq('prospect_id', filters.prospect_id)
    }

    if (filters?.customer_user_id) {
      query = query.eq('customer_user_id', filters.customer_user_id)
    }

    if (filters?.overdue_only) {
      query = query
        .lt('due_date', new Date().toISOString().split('T')[0])
        .neq('status', 'paid')
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Get a single movement by ID
   */
  async getMovementById(id: string) {
    const { data, error } = await this.supabase
      .from('product_movements')
      .select(`
        *,
        prospect:prospects(*),
        customer:users!customer_user_id(*),
        payments:movement_payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new product movement
   * This will automatically generate a movement number and affect inventory
   */
  async createMovement(data: ProductMovementData) {
    const { data: { user } } = await this.supabase.auth.getUser()

    // Movement number will be auto-generated by trigger
    const { data: movement, error } = await this.supabase
      .from('product_movements')
      .insert({
        ...data,
        items: data.items as any,
        created_by: user?.id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return movement
  }

  /**
   * Update movement status
   */
  async updateMovementStatus(id: string, status: string, deliveryDate?: string) {
    const updateData: any = { status, updated_at: new Date().toISOString() }
    
    if (deliveryDate) {
      updateData.delivery_date = deliveryDate
    }

    const { data, error } = await this.supabase
      .from('product_movements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Return consignment items (restore to inventory)
   */
  async returnConsignment(movementId: string, returnedItems: ProductMovementItem[]) {
    // Update movement status to returned
    const { data, error } = await this.supabase
      .from('product_movements')
      .update({
        status: 'returned',
        items: returnedItems as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', movementId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Convert consignment to sale
   */
  async convertConsignmentToSale(movementId: string) {
    const { data, error } = await this.supabase
      .from('product_movements')
      .update({
        status: 'sold',
        updated_at: new Date().toISOString()
      })
      .eq('id', movementId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Register a payment for a movement
   */
  async registerPayment(data: MovementPaymentData) {
    const { data: { user } } = await this.supabase.auth.getUser()

    const { data: payment, error } = await this.supabase
      .from('movement_payments')
      .insert({
        ...data,
        created_by: user?.id
      })
      .select()
      .single()

    if (error) throw error
    return payment
  }

  /**
   * Get debts (movements with pending payments)
   */
  async getDebts(filters?: {
    overdue_only?: boolean
  }) {
    let query = this.supabase
      .from('product_movements')
      .select(`
        *,
        prospect:prospects(*),
        customer:users!customer_user_id(*),
        payments:movement_payments(*)
      `)
      .in('movement_type', ['sale_credit', 'consignment'])
      .in('status', ['delivered', 'sold', 'partial_paid', 'overdue'])

    if (filters?.overdue_only) {
      query = query
        .lt('due_date', new Date().toISOString().split('T')[0])
        .neq('status', 'paid')
    }

    const { data, error } = await query
    if (error) throw error

    // Calculate remaining balance for each movement
    return (data || []).map((movement: any) => {
      const totalPaid = movement.payments?.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0
      ) || 0
      const remainingBalance = Number(movement.total_amount) - totalPaid

      return {
        ...movement,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      }
    })
  }

  /**
   * Get summary statistics for CRM dashboard
   */
  async getCRMStats() {
    // Get prospect counts by stage
    const { data: prospectsByStage } = await this.supabase
      .from('prospects')
      .select('stage, type')
    
    // Get movement counts by type and status
    const { data: movements } = await this.supabase
      .from('product_movements')
      .select('movement_type, status, total_amount, amount_paid')
    
    // Get overdue movements
    const { data: overdue } = await this.supabase
      .from('product_movements')
      .select('total_amount, amount_paid')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .neq('status', 'paid')

    const stats = {
      prospects: {
        b2b: {
          contact: 0,
          interested: 0,
          sample_sent: 0,
          negotiation: 0,
          converted: 0,
          lost: 0
        },
        b2c: {
          contact: 0,
          interested: 0,
          sample_sent: 0,
          negotiation: 0,
          converted: 0,
          lost: 0
        }
      },
      movements: {
        samples: 0,
        consignments: 0,
        sales: 0
      },
      debts: {
        total_pending: 0,
        overdue_amount: 0,
        overdue_count: 0
      }
    }

    // Count prospects by stage and type
    prospectsByStage?.forEach((p: any) => {
      if (p.type === 'b2b') {
        stats.prospects.b2b[p.stage as keyof typeof stats.prospects.b2b]++
      } else {
        stats.prospects.b2c[p.stage as keyof typeof stats.prospects.b2c]++
      }
    })

    // Count movements
    movements?.forEach((m: any) => {
      if (m.movement_type === 'sample') stats.movements.samples++
      else if (m.movement_type === 'consignment') stats.movements.consignments++
      else if (m.movement_type === 'sale_invoice' || m.movement_type === 'sale_credit') {
        stats.movements.sales++
      }
    })

    // Calculate debts
    movements?.forEach((m: any) => {
      if (['sale_credit', 'consignment'].includes(m.movement_type) && m.status !== 'paid') {
        const remaining = Number(m.total_amount) - Number(m.amount_paid || 0)
        stats.debts.total_pending += remaining
      }
    })

    overdue?.forEach((m: any) => {
      const remaining = Number(m.total_amount) - Number(m.amount_paid || 0)
      stats.debts.overdue_amount += remaining
      stats.debts.overdue_count++
    })

    return stats
  }

  /**
   * Approve prospect as B2B client
   */
  async approveProspectAsB2B(
    prospectId: string,
    data: { creditLimit: number; paymentTermsDays?: number }
  ) {
    const { data: prospect, error } = await this.supabase
      .from('prospects')
      .update({
        is_b2b_active: false,
        credit_limit: data.creditLimit,
        payment_terms_days: data.paymentTermsDays || 30,
        stage: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', prospectId)
      .select('*')
      .single()

    if (error) throw error
    return prospect
  }

  /**
   * Get fixed prices for a prospect
   */
  async getProspectProductPrices(prospectId: string) {
    const { data, error } = await this.supabase
      .from('prospect_product_prices')
      .select('product_id, fixed_price')
      .eq('prospect_id', prospectId)

    if (error) throw error
    return data || []
  }

  /**
   * Sync fixed prices for a prospect
   */
  async syncProspectProductPrices(
    prospectId: string,
    fixedPrices: Array<{ productId: string; fixedPrice: number }>
  ) {
    const normalized = fixedPrices
      .map(price => ({
        prospect_id: prospectId,
        product_id: price.productId,
        fixed_price: Number(price.fixedPrice)
      }))
      .filter(price => price.product_id && Number.isFinite(price.fixed_price) && price.fixed_price > 0)

    if (normalized.length === 0) {
      const { error } = await this.supabase
        .from('prospect_product_prices')
        .delete()
        .eq('prospect_id', prospectId)

      if (error) throw error
      return
    }

    const productIds = normalized.map(price => `"${price.product_id}"`).join(',')

    const { error: deleteError } = await this.supabase
      .from('prospect_product_prices')
      .delete()
      .eq('prospect_id', prospectId)
      .not('product_id', 'in', `(${productIds})`)

    if (deleteError) throw deleteError

    const { error: upsertError } = await this.supabase
      .from('prospect_product_prices')
      .upsert(normalized, { onConflict: 'prospect_id,product_id' })

    if (upsertError) throw upsertError
  }

  /**
   * Update a product movement
   */
  async updateMovement(
    id: string,
    data: Partial<ProductMovementData> & { status?: string }
  ) {
    const updatePayload: any = {
      ...data,
      updated_at: new Date().toISOString()
    }

    if (data.items) {
      updatePayload.items = data.items as any
    }

    const { data: movement, error } = await this.supabase
      .from('product_movements')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return movement
  }

  /**
   * Delete a product movement
   */
  async deleteMovement(id: string) {
    // First delete related payments
    const { error: paymentsError } = await this.supabase
      .from('movement_payments')
      .delete()
      .eq('movement_id', id)

    if (paymentsError) throw paymentsError

    // Then delete the movement
    const { error } = await this.supabase
      .from('product_movements')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  }
}
