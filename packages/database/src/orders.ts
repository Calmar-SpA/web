import { SupabaseClient } from '@supabase/supabase-js'

// Unified order item for display
export interface UnifiedOrderItem {
  id: string
  source: 'order' | 'movement'
  type: 'online' | 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit'
  reference_number: string
  status: string
  items_count: number
  total_amount: number
  amount_paid: number
  remaining_balance: number
  due_date: string | null
  created_at: string
  // For consignments - can request return
  can_request_return: boolean
  // For pending payments
  can_pay: boolean
  // Documents
  invoice_url: string | null
  dispatch_order_url: string | null
}

export class OrderService {
  constructor(private supabase: SupabaseClient) {}

  async getOrdersByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getOrderById(orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*, products(*)), payments(*)')
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  }

  async getAllOrders() {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(count)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get unified list of orders and movements for admin panel
   * Combines web orders (orders table) and CRM movements (product_movements table)
   */
  async getAllOrdersUnified(filter?: { type?: 'personal' | 'business' | 'all' }) {
    const unified: any[] = []
    const filterType = filter?.type || 'all'

    // 1. Get web orders
    if (filterType === 'all' || filterType === 'personal' || filterType === 'business') {
      let ordersQuery = this.supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, is_business_order, email, shipping_address, user:users!user_id(full_name, email), order_items(count), payments(payment_provider)')
        .order('created_at', { ascending: false })

      // Apply filter for personal/business
      if (filterType === 'personal') {
        ordersQuery = ordersQuery.eq('is_business_order', false)
      } else if (filterType === 'business') {
        ordersQuery = ordersQuery.eq('is_business_order', true)
      }

      const { data: orders, error: ordersError } = await ordersQuery

      if (ordersError) throw ordersError

      // Add orders to unified list
      for (const order of orders || []) {
        const isBusinessOrder = Boolean(order.is_business_order)
        
        // Get customer name from user relation or shipping_address
        const shippingAddress = order.shipping_address as { name?: string } | null
        const customerName = (order.user as any)?.full_name || shippingAddress?.name || order.email || 'N/A'
        const customerEmail = (order.user as any)?.email || order.email || 'N/A'
        
        unified.push({
          id: order.id,
          source: 'order',
          type: isBusinessOrder ? 'business_order' : 'personal_order',
          reference_number: order.order_number,
          customer_name: customerName,
          customer_email: customerEmail,
          status: order.status,
          items_count: order.order_items?.[0]?.count || 0,
          total_amount: Number(order.total_amount),
          created_at: order.created_at,
          payment_provider: order.payments?.[0]?.payment_provider || null
        })
      }
    }

    // 2. Get CRM movements (only for 'business' or 'all')
    if (filterType === 'all' || filterType === 'business') {
      const { data: movements, error: movementsError } = await this.supabase
        .from('product_movements')
        .select(`
          id, movement_number, movement_type, status, total_amount, amount_paid, 
          due_date, created_at, items,
          prospect:prospects(id, contact_name, company_name, email),
          customer:users!customer_user_id(id, email, full_name)
        `)
        .in('movement_type', ['sale_invoice', 'sale_credit', 'consignment'])
        .order('created_at', { ascending: false })

      if (movementsError) throw movementsError

      // Add movements to unified list
      for (const movement of movements || []) {
        const itemsArray = Array.isArray(movement.items) ? movement.items : []
        const totalPaid = Number(movement.amount_paid || 0)
        const remainingBalance = Number(movement.total_amount) - totalPaid

        // Determine customer name
        let customerName = 'N/A'
        let customerEmail = 'N/A'
        
        // Supabase returns relations as arrays, get first element
        const prospect = Array.isArray(movement.prospect) ? movement.prospect[0] : movement.prospect
        const customer = Array.isArray(movement.customer) ? movement.customer[0] : movement.customer
        
        if (prospect) {
          customerName = prospect.company_name || prospect.contact_name
          customerEmail = prospect.email
        } else if (customer) {
          customerName = customer.full_name || customer.email
          customerEmail = customer.email
        }

        unified.push({
          id: movement.id,
          source: 'movement',
          type: movement.movement_type, // 'sale_invoice', 'sale_credit', 'consignment'
          reference_number: movement.movement_number,
          customer_name: customerName,
          customer_email: customerEmail,
          status: movement.status,
          items_count: itemsArray.length,
          total_amount: Number(movement.total_amount),
          amount_paid: totalPaid,
          remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
          due_date: movement.due_date,
          created_at: movement.created_at,
          payment_provider: null
        })
      }
    }

    // Sort by created_at descending
    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return unified
  }

  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get unified list of orders and movements for user's account page
   * Combines web orders (orders table) and CRM movements (product_movements table)
   */
  async getUnifiedOrdersForUser(userId: string): Promise<UnifiedOrderItem[]> {
    const unified: UnifiedOrderItem[] = []

    // 1. Get web orders by user_id
    const { data: orders, error: ordersError } = await this.supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, is_business_order, order_items(count), payments(payment_provider)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Add orders to unified list
    for (const order of orders || []) {
      // Determinar el tipo basado en is_business_order y el payment_provider
      const paymentProvider = order.payments?.[0]?.payment_provider
      const isBusinessOrder = Boolean(order.is_business_order)
      const isCreditPayment = paymentProvider === 'internal_credit'
      
      // Si es orden de empresa con crédito, usar 'sale_credit' para que aparezca en Movimientos de Empresa
      const orderType: UnifiedOrderItem['type'] = (isBusinessOrder && isCreditPayment) 
        ? 'sale_credit' 
        : 'online'

      unified.push({
        id: order.id,
        source: 'order',
        type: orderType,
        reference_number: order.order_number,
        status: order.status,
        items_count: order.order_items?.[0]?.count || 0,
        total_amount: Number(order.total_amount),
        amount_paid: order.status === 'paid' || order.status === 'delivered' || order.status === 'shipped' || order.status === 'processing' 
          ? Number(order.total_amount) 
          : 0,
        remaining_balance: order.status === 'pending_payment' ? Number(order.total_amount) : 0,
        due_date: null,
        created_at: order.created_at,
        can_request_return: false,
        can_pay: order.status === 'pending_payment',
        invoice_url: null,
        dispatch_order_url: null
      })
    }

    // 2. Get movements via prospect_id
    // First, find the prospect(s) associated with this user
    const { data: userProspects } = await this.supabase
      .from('prospects')
      .select('id')
      .eq('user_id', userId)

    const prospectIds = userProspects?.map(p => p.id) || []

    if (prospectIds.length > 0) {
      const { data: movements, error: movementsError } = await this.supabase
        .from('product_movements')
        .select(`
          id, movement_number, movement_type, status, total_amount, amount_paid, 
          due_date, created_at, items, invoice_url, dispatch_order_url,
          payments:movement_payments(amount)
        `)
        .in('prospect_id', prospectIds)
        .order('created_at', { ascending: false })

      if (movementsError) throw movementsError

      // Add movements to unified list
      for (const movement of movements || []) {
        const totalPaid = movement.payments?.reduce(
          (sum: number, p: { amount: number }) => sum + Number(p.amount), 0
        ) || Number(movement.amount_paid || 0)
        
        const remainingBalance = Number(movement.total_amount) - totalPaid
        const itemsArray = Array.isArray(movement.items) ? movement.items : []

        // Determine type label
        const typeMap: Record<string, UnifiedOrderItem['type']> = {
          'sample': 'sample',
          'consignment': 'consignment',
          'sale_invoice': 'sale_invoice',
          'sale_credit': 'sale_credit'
        }

        unified.push({
          id: movement.id,
          source: 'movement',
          type: typeMap[movement.movement_type] || 'sale_invoice',
          reference_number: movement.movement_number,
          status: movement.status,
          items_count: itemsArray.length,
          total_amount: Number(movement.total_amount),
          amount_paid: totalPaid,
          remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
          due_date: movement.due_date,
          created_at: movement.created_at,
          // Can request return only for consignments with status 'delivered'
          can_request_return: movement.movement_type === 'consignment' && movement.status === 'delivered',
          // Can pay if there's remaining balance and it's not a sample
          can_pay: remainingBalance > 0 && movement.movement_type !== 'sample',
          invoice_url: movement.invoice_url,
          dispatch_order_url: movement.dispatch_order_url
        })
      }
    }

    // Sort by created_at descending
    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return unified
  }

  /**
   * Get movement detail for user (includes products info)
   */
  async getMovementForUser(movementId: string) {
    const { data, error } = await this.supabase
      .from('product_movements')
      .select(`
        *,
        payments:movement_payments(id, amount, payment_method, payment_reference, paid_at)
      `)
      .eq('id', movementId)
      .single()

    if (error) throw error

    // Resolve product info for items
    if (data && Array.isArray(data.items)) {
      const productIds = data.items.map((item: any) => item.product_id).filter(Boolean)
      
      if (productIds.length > 0) {
        const { data: products } = await this.supabase
          .from('products')
          .select('id, name, sku, image_url')
          .in('id', productIds)

        const productMap = new Map(products?.map(p => [p.id, p]) || [])
        
        data.items = data.items.map((item: any) => ({
          ...item,
          product: productMap.get(item.product_id) || null
        }))
      }
    }

    // Calculate remaining balance
    const totalPaid = data?.payments?.reduce(
      (sum: number, p: { amount: number }) => sum + Number(p.amount), 0
    ) || 0
    
    return {
      ...data,
      total_paid: totalPaid,
      remaining_balance: Number(data?.total_amount || 0) - totalPaid
    }
  }

  /**
   * Request return for a consignment (user action)
   */
  async requestConsignmentReturn(movementId: string) {
    // The RLS policy ensures only consignments with status 'delivered' 
    // belonging to the user can be updated
    const { data, error } = await this.supabase
      .from('product_movements')
      .update({ status: 'returned' })
      .eq('id', movementId)
      .eq('movement_type', 'consignment')
      .eq('status', 'delivered')
      .select()
      .single()

    if (error) throw error
    return data
  }
}
