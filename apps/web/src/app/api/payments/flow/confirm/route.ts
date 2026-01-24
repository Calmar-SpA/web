import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'
import { sendOrderPaidAdminEmail, sendOrderPaidCustomerEmail } from '@/lib/mail'
import { notifyLowInventoryIfNeeded } from '@/lib/inventory-alerts'
import { LoyaltyService } from '@calmar/database'

// GET handler for URL verification (Flow/Transbank checks this endpoint is accessible)
export async function GET() {
  return new Response('OK', { status: 200 })
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string

  if (!token) {
    console.error('[Flow Confirm] No token received')
    return new Response('No token', { status: 400 })
  }

  try {
    const status = await flow.getStatus(token)
    const supabase = await createClient()

    // Log the confirmation for debugging
    console.log(`[Flow Confirm] Order: ${status.commerceOrder}, Status: ${status.status}, Token: ${token}`)

    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status.status === 2 ? 'completed' : 'failed',
        metadata: status
      })
      .eq('provider_transaction_id', token)

    if (paymentError) {
      console.error('[Flow Confirm] Payment update error:', paymentError)
    }

    // Update order status if paid
    if (status.status === 2) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', status.commerceOrder)
        .select('id, user_id, order_number, email, total_amount, shipping_address, is_business_order')
        .single()

      if (orderError) {
        console.error('[Flow Confirm] Order update error:', orderError)
      }

      if (!order) {
        console.error(`[Flow Confirm] Order not found: ${status.commerceOrder}`)
        return new Response('OK', { status: 200 })
      }

      console.log(`[Flow Confirm] Order found: ${order.order_number}, Email: ${order.email}`)

      if (order.user_id && !order.is_business_order) {
        try {
          const loyaltyService = new LoyaltyService(supabase)
          await loyaltyService.awardPoints(order.user_id, status.commerceOrder, Number(order.total_amount))
          console.log(`[Flow Confirm] Loyalty points awarded for user: ${order.user_id}`)
        } catch (loyaltyError) {
          console.error('[Flow Confirm] Loyalty points error:', loyaltyError)
        }
      }

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, variant_id, product_name, variant_name, quantity, subtotal')
        .eq('order_id', order.id)

      if (itemsError) {
        console.error('[Flow Confirm] Order items error:', itemsError)
      }

      const customerName = order.shipping_address?.name || 'Cliente'
      const shippingSummary = order.shipping_address
        ? `${order.shipping_address.address}, ${order.shipping_address.comuna}, ${order.shipping_address.region}`
        : 'Sin direccion registrada'

      // Send customer email
      if (order.email) {
        try {
          const customerEmailResult = await sendOrderPaidCustomerEmail({
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
          console.log(`[Flow Confirm] Customer email result:`, customerEmailResult)
        } catch (emailError) {
          console.error('[Flow Confirm] Customer email error:', emailError)
        }
      } else {
        console.error('[Flow Confirm] No email found for order:', order.id)
      }

      // Send admin email
      try {
        const adminEmailResult = await sendOrderPaidAdminEmail({
          orderNumber: order.order_number,
          customerName,
          customerEmail: order.email,
          totalAmount: Number(order.total_amount),
          paymentMethod: 'Flow',
          shippingSummary,
        })
        console.log(`[Flow Confirm] Admin email result:`, adminEmailResult)
      } catch (emailError) {
        console.error('[Flow Confirm] Admin email error:', emailError)
      }

      // Check inventory
      try {
        await notifyLowInventoryIfNeeded(supabase, orderItems || [])
      } catch (inventoryError) {
        console.error('[Flow Confirm] Inventory check error:', inventoryError)
      }
    } else {
      console.log(`[Flow Confirm] Payment not completed. Status: ${status.status}`)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('[Flow Confirm] Critical error:', error)
    return new Response('Error', { status: 500 })
  }
}
