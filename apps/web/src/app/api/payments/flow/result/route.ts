import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'

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
  console.log('[Flow Result] POST request received')
  
  const formData = await request.formData()
  const token = formData.get('token') as string
  
  console.log('[Flow Result] Token received:', token ? 'yes' : 'no')
  
  // Get base URL for production redirects (ensure HTTPS)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!token) {
    console.error('[Flow Result] No token received')
    return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/checkout?error=no_token`)
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
      
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, shipping_address')
        .eq('id', status.commerceOrder)
        .single()

      const rutUpdated = Boolean((order?.shipping_address as any)?.rut_updated)
      const successParams = new URLSearchParams({ 
        orderId: status.commerceOrder,
        orderNumber: order?.order_number || ''
      })
      if (rutUpdated) {
        successParams.set('rutUpdated', '1')
      }

      return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/checkout/success?${successParams.toString()}`)
    } else {
      return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/checkout/error?orderId=${status.commerceOrder}`)
    }

  } catch (error) {
    console.error('Flow Result Error:', error)
    return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/checkout/error`)
  }
}

// Also handle GET requests in case the browser follows the redirect
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  if (!token) {
    return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/checkout?error=no_token`)
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
