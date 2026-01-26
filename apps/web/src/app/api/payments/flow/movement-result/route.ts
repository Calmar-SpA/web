import { NextRequest, NextResponse } from 'next/server'
import { flow } from '@/lib/flow'

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

// This route handles the return from Flow after payment
// User is redirected here after completing (or cancelling) payment

export async function GET(request: NextRequest) {
  console.log('[Movement Flow Result] GET request received')
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    // No token - redirect to orders with error
    return NextResponse.redirect(new URL('/account/orders?payment=error', request.url))
  }

  try {
    const status = await flow.getStatus(token)
    
    // Extract movement ID from commerceOrder (format: MOV-{movementId})
    const commerceOrder = status.commerceOrder
    if (!commerceOrder || !commerceOrder.startsWith('MOV-')) {
      return NextResponse.redirect(new URL('/account/orders?payment=error', request.url))
    }

    const movementId = commerceOrder.replace('MOV-', '')

    // Redirect based on payment status
    // Status 2 = paid, 1 = pending, 3 = rejected, 4 = cancelled
    if (status.status === 2) {
      // Payment successful
      return NextResponse.redirect(
        new URL(`/account/orders/m/${movementId}?payment=success`, request.url)
      )
    } else if (status.status === 1) {
      // Payment pending
      return NextResponse.redirect(
        new URL(`/account/orders/m/${movementId}?payment=pending`, request.url)
      )
    } else {
      // Payment failed or cancelled
      return NextResponse.redirect(
        new URL(`/account/orders/m/${movementId}?payment=failed`, request.url)
      )
    }

  } catch (error) {
    console.error('[Movement Flow Result] Error:', error)
    return NextResponse.redirect(new URL('/account/orders?payment=error', request.url))
  }
}

// Flow might POST to this endpoint in some cases
export async function POST(request: NextRequest) {
  console.log('[Movement Flow Result] POST request received')
  
  // Parse form data and extract token
  const formData = await request.formData()
  const token = formData.get('token') as string

  if (!token) {
    console.error('[Movement Flow Result] No token received')
    return NextResponse.redirect(new URL('/account/orders?payment=error', request.url))
  }

  // Reuse GET logic
  const url = new URL(request.url)
  url.searchParams.set('token', token)
  
  return GET(new NextRequest(url))
}
