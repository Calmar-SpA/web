
import { SupabaseClient } from '@supabase/supabase-js'

export class LoyaltyService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the current points balance for a user
   */
  async getUserBalance(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('points_balance')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.points_balance || 0
  }

  /**
   * Get the points transaction history for a user
   */
  async getTransactions(userId: string) {
    const { data, error } = await this.supabase
      .from('loyalty_points')
      .select(`
        *,
        orders (
          order_number
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Award points to a user for an order
   * Calculation: 1 point per $100 CLP
   */
  async awardPoints(userId: string, orderId: string, totalAmount: number) {
    const pointsToAward = Math.floor(totalAmount / 100)

    if (pointsToAward <= 0) return 0

    // 1. Check if points were already awarded for this order to prevent double-dipping
    const { data: existing } = await this.supabase
      .from('loyalty_points')
      .select('id')
      .eq('order_id', orderId)
      .gt('points_change', 0)
      .maybeSingle()

    if (existing) return 0

    // 2. Perform transaction: Log entry + Update user balance
    const { error: logError } = await this.supabase
      .from('loyalty_points')
      .insert({
        user_id: userId,
        order_id: orderId,
        points_change: pointsToAward,
        reason: 'Compra realizada'
      })

    if (logError) throw logError

    const { error: updateError } = await this.supabase.rpc('increment_points', {
      user_id_param: userId,
      points_param: pointsToAward
    })

    if (updateError) throw updateError

    return pointsToAward
  }

  /**
   * Redeem points for a discount
   */
  async redeemPoints(userId: string, orderId: string, points: number) {
    if (points <= 0) return

    // 1. Record redemption log
    const { error: logError } = await this.supabase
      .from('loyalty_points')
      .insert({
        user_id: userId,
        order_id: orderId,
        points_change: -points,
        reason: 'Canje de puntos en compra'
      })

    if (logError) throw logError

    // 2. Update user balance (decrease)
    const { error: updateError } = await this.supabase.rpc('increment_points', {
      user_id_param: userId,
      points_param: -points
    })

    if (updateError) throw updateError
  }
}
