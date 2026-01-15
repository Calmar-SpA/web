import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'
import { sendOrderPaidAdminEmail, sendOrderPaidCustomerEmail } from '@/lib/mail'
import { notifyLowInventoryIfNeeded } from '@/lib/inventory-alerts'

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
        .select('id, user_id, order_number, email, total_amount, shipping_address')
        .single()

      if (order?.user_id) {
        const { LoyaltyService } = await import('@calmar/database')
        const loyaltyService = new LoyaltyService(supabase)
        await loyaltyService.awardPoints(order.user_id, status.commerceOrder, Number(order.total_amount))
      }

      if (order) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_id, variant_id, product_name, variant_name, quantity, subtotal')
          .eq('order_id', order.id)

        const customerName = order.shipping_address?.name || 'Cliente'
        const shippingSummary = order.shipping_address
          ? `${order.shipping_address.address}, ${order.shipping_address.comuna}, ${order.shipping_address.region}`
          : 'Sin direccion registrada'

        await sendOrderPaidCustomerEmail({
          email: order.email,
          customerName,
          orderNumber: order.order_number,
          orderId: order.id,
          orderStatusLabel: 'pagado',
          totalAmount: Number(order.total_amount),
          items: (orderItems || []).map(item => ({
            name: item.product_name,
            variantName: item.variant_name,
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
          })),
        })

        await sendOrderPaidAdminEmail({
          orderNumber: order.order_number,
          customerName,
          customerEmail: order.email,
          totalAmount: Number(order.total_amount),
          paymentMethod: 'Flow',
          shippingSummary,
        })

        await notifyLowInventoryIfNeeded(supabase, orderItems || [])
      }
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Flow Confirmation Error:', error)
    return new Response('Error', { status: 500 })
  }
}
