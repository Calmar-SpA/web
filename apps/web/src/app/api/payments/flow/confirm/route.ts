import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string

  if (!token) {
    return new Response('No token', { status: 400 })
  }

  try {
    const status = await flow.getStatus(token)
    const supabase = await createClient()

    // Log the confirmation for debugging
    console.log(`Flow Confirmation received for Order ${status.commerceOrder}, Status: ${status.status}`)

    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status.status === 2 ? 'completed' : 'failed',
        metadata: status
      })
      .eq('provider_transaction_id', token)

    // Update order status if paid
    if (status.status === 2) {
      const { data: order } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', status.commerceOrder)
        .select('user_id, total_amount')
        .single()

      if (order?.user_id) {
        const { LoyaltyService } = await import('@calmar/database')
        const loyaltyService = new LoyaltyService(supabase)
        await loyaltyService.awardPoints(order.user_id, status.commerceOrder, Number(order.total_amount))
      }
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Flow Confirmation Error:', error)
    return new Response('Error', { status: 500 })
  }
}
