'use server'

import { flow } from '@/lib/flow'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Verifies and syncs the order payment status with Flow.
 * This is a fallback in case the Flow callback didn't arrive.
 * 
 * @param orderId - The order UUID
 * @returns Object with synced status and whether it was updated
 */
export async function syncOrderPaymentStatus(orderId: string): Promise<{
  success: boolean
  wasUpdated: boolean
  currentStatus: string
  error?: string
}> {
  console.log(`[Sync Payment] Checking order: ${orderId}`)
  
  const supabase = createAdminClient()
  
  // Get order with payment info
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, payments(id, status, provider_transaction_id)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[Sync Payment] Order not found:', orderError)
    return { 
      success: false, 
      wasUpdated: false, 
      currentStatus: 'unknown',
      error: 'Pedido no encontrado' 
    }
  }

  // If already paid, no need to check
  if (order.status !== 'pending_payment') {
    console.log(`[Sync Payment] Order already has status: ${order.status}`)
    return { 
      success: true, 
      wasUpdated: false, 
      currentStatus: order.status 
    }
  }

  // Check if there's a Flow payment to verify
  const flowPayment = order.payments?.find(
    (p: any) => p.provider_transaction_id && p.status === 'pending'
  )

  if (!flowPayment) {
    console.log('[Sync Payment] No pending Flow payment found')
    return { 
      success: true, 
      wasUpdated: false, 
      currentStatus: order.status 
    }
  }

  try {
    // Query Flow API for the real payment status
    console.log(`[Sync Payment] Querying Flow for order: ${orderId}`)
    const flowStatus = await flow.getStatusByCommerceId(orderId)
    console.log('[Sync Payment] Flow response:', JSON.stringify(flowStatus))

    // Flow status 2 = paid
    if (flowStatus.status === 2) {
      console.log('[Sync Payment] Payment confirmed by Flow, updating order...')
      
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          metadata: flowStatus 
        })
        .eq('id', flowPayment.id)

      if (paymentError) {
        console.error('[Sync Payment] Payment update error:', paymentError)
      }

      // Update order status
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)

      if (orderUpdateError) {
        console.error('[Sync Payment] Order update error:', orderUpdateError)
        return {
          success: false,
          wasUpdated: false,
          currentStatus: order.status,
          error: 'Error actualizando pedido'
        }
      }

      console.log('[Sync Payment] Order updated to paid successfully')
      return {
        success: true,
        wasUpdated: true,
        currentStatus: 'paid'
      }
    } else {
      console.log(`[Sync Payment] Flow status is ${flowStatus.status}, not paid yet`)
      return {
        success: true,
        wasUpdated: false,
        currentStatus: order.status
      }
    }
  } catch (error: any) {
    console.error('[Sync Payment] Flow API error:', error?.message || error)
    // Don't fail the page load if Flow API is unavailable
    return {
      success: true,
      wasUpdated: false,
      currentStatus: order.status,
      error: 'No se pudo verificar con Flow'
    }
  }
}
