import { SupabaseClient } from '@supabase/supabase-js'

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
}
