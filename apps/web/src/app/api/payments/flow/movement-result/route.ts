import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createAdminClient } from '@/lib/supabase/admin'

// Default locale
const DEFAULT_LOCALE = 'es'

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

export async function POST(request: NextRequest) {
  console.log('[Movement Flow Result] POST request received')
  
  const formData = await request.formData()
  const token = formData.get('token') as string
  
  // Get base URL for production redirects (ensure HTTPS)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!token) {
    console.error('[Movement Flow Result] No token received')
    return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/account/orders?payment=error`, 303)
  }

  try {
    const status = await flow.getStatus(token)
    
    // Extract movement ID from commerceOrder (format: MOV-{movementId})
    const commerceOrder = status.commerceOrder
    if (!commerceOrder || !commerceOrder.startsWith('MOV-')) {
        console.error('[Movement Flow Result] Invalid commerce order:', commerceOrder)
        return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/account/orders?payment=error`, 303)
    }

    const movementId = commerceOrder.replace('MOV-', '')

    // Use admin client to bypass RLS (this is a server callback)
    const supabase = createAdminClient()

    // Redirect based on payment status
    // Status 2 = paid, 1 = pending, 3 = rejected, 4 = cancelled
    if (status.status === 2) {
      // Payment successful - Update DB as fallback
      
      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('movement_payments')
        .select('id')
        .eq('payment_reference', token)
        .single()

      if (!existingPayment) {
        console.log(`[Movement Flow Result] Registering payment fallback for ${movementId}`)
        const { error: paymentError } = await supabase
            .from('movement_payments')
            .insert({
            movement_id: movementId,
            amount: status.amount,
            payment_method: 'credit_card', // Flow uses cards
            payment_reference: token,
            notes: `Pago online via Flow - ${status.paymentData?.media || 'Tarjeta'} (Fallback)`,
            created_by: null
            })
        
        if (paymentError) {
            console.error('[Movement Flow Result] Payment insert error:', paymentError)
        }
      }

      return NextResponse.redirect(
        `${baseUrl}/${DEFAULT_LOCALE}/account/orders/m/${movementId}?payment=success`, 
        303
      )
    } else if (status.status === 1) {
      // Payment pending
      return NextResponse.redirect(
        `${baseUrl}/${DEFAULT_LOCALE}/account/orders/m/${movementId}?payment=pending`, 
        303
      )
    } else {
      // Payment failed or cancelled
      return NextResponse.redirect(
        `${baseUrl}/${DEFAULT_LOCALE}/account/orders/m/${movementId}?payment=failed`, 
        303
      )
    }

  } catch (error) {
    console.error('[Movement Flow Result] Error:', error)
    return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/account/orders?payment=error`, 303)
  }
}

// Also handle GET requests in case the browser follows the redirect
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  if (!token) {
    return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/account/orders?payment=error`, 303)
  }
  
  // Create form data and call POST handler
  const formData = new FormData()
  formData.append('token', token)
  
  // Create a new request with the token
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    body: formData,
  })
  
  return POST(newRequest)
}
