import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'

// CORS headers for Flow callbacks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// GET handler for URL verification (Flow checks this endpoint is accessible)
export async function GET() {
  console.log('[Movement Flow Confirm] GET verification request received')
  return new Response('OK', { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  console.log('[Movement Flow Confirm] POST request received')
  
  const formData = await request.formData()
  const token = formData.get('token') as string

  if (!token) {
    console.error('[Movement Flow Confirm] No token received')
    return new Response('No token', { status: 400, headers: corsHeaders })
  }

  try {
    const status = await flow.getStatus(token)
    const supabase = await createClient()

    // Extract movement ID from commerceOrder (format: MOV-{movementId})
    const commerceOrder = status.commerceOrder
    if (!commerceOrder || !commerceOrder.startsWith('MOV-')) {
      console.error('[Movement Flow Confirm] Invalid commerce order format:', commerceOrder)
      return new Response('Invalid order format', { status: 400 })
    }

    const movementId = commerceOrder.replace('MOV-', '')

    console.log(`[Movement Flow Confirm] Movement: ${movementId}, Status: ${status.status}, Token: ${token}`)

    // Only process if payment was successful (status 2 = paid)
    if (status.status === 2) {
      // Register payment in movement_payments table
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: paymentError } = await supabase
        .from('movement_payments')
        .insert({
          movement_id: movementId,
          amount: status.amount,
          payment_method: 'credit_card', // Flow uses cards
          payment_reference: token,
          notes: `Pago online via Flow - ${status.paymentData?.media || 'Tarjeta'}`,
          created_by: user?.id || null
        })

      if (paymentError) {
        console.error('[Movement Flow Confirm] Payment insert error:', paymentError)
        // The trigger will update movement status automatically
      } else {
        console.log(`[Movement Flow Confirm] Payment registered for movement ${movementId}, amount: ${status.amount}`)
      }

      // Note: The trigger update_movement_payment_status will automatically:
      // 1. Update amount_paid on the movement
      // 2. Update status to 'paid' or 'partial_paid'

    } else {
      console.log(`[Movement Flow Confirm] Payment not completed. Status: ${status.status}`)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('[Movement Flow Confirm] Critical error:', error)
    return new Response('Error', { status: 500, headers: corsHeaders })
  }
}
