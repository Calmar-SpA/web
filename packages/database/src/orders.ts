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
      .select('id, order_number, status, total_amount, created_at, order_items(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Add orders to unified list
    for (const order of orders || []) {
      unified.push({
        id: order.id,
        source: 'order',
        type: 'online',
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

    // 2. Get movements via prospect_id (RLS will filter to user's own)
    const { data: movements, error: movementsError } = await this.supabase
      .from('product_movements')
      .select(`
        id, movement_number, movement_type, status, total_amount, amount_paid, 
        due_date, created_at, items, invoice_url, dispatch_order_url,
        payments:movement_payments(amount)
      `)
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
