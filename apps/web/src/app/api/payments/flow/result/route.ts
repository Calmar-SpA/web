import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string

  if (!token) {
    return NextResponse.redirect(new URL('/checkout?error=no_token', request.url))
  }

  try {
    const status = await flow.getStatus(token)
    const supabase = await createClient()

    // Update payment status in DB
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status.status === 2 ? 'completed' : 'failed',
        provider_transaction_id: token,
      })
      .eq('provider_transaction_id', token)

    // Update order status
    if (status.status === 2) {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', status.commerceOrder)
      
      return NextResponse.redirect(new URL(`/checkout/success?orderId=${status.commerceOrder}`, request.url))
    } else {
      return NextResponse.redirect(new URL(`/checkout/error?orderId=${status.commerceOrder}`, request.url))
    }

  } catch (error) {
    console.error('Flow Result Error:', error)
    return NextResponse.redirect(new URL('/checkout/error', request.url))
  }
}
