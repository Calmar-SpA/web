import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'
import { createClient } from '@/lib/supabase/server'

// Default locale
const DEFAULT_LOCALE = 'es'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string
  
  // Get base URL for production redirects (ensure HTTPS)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!token) {
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
      
      return NextResponse.redirect(`${baseUrl}/${DEFAULT_LOCALE}/checkout/success?orderId=${status.commerceOrder}`)
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
