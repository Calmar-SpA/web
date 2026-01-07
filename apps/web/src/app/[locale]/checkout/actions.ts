'use server'

import { createClient } from '@/lib/supabase/server'
import { flow } from '@/lib/flow'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface CheckoutData {
  items: any[];
  customerInfo: {
    name: string;
    email: string;
    address: string;
    comuna: string;
    region: string;
  };
  total: number;
  pointsToRedeem?: number;
  paymentMethod?: 'flow' | 'credit';
}

export async function createOrderAndInitiatePayment(data: CheckoutData) {
  const supabase = await createClient()
  
  // 1. Get current user (if logged in)
  const { data: { user } } = await supabase.auth.getUser()

  let baseTotal = data.total
  let b2bDiscount = 0
  let redeemedPoints = 0

  // 2. Handle B2B Discount
  if (user) {
    const { B2BService } = await import('@calmar/database')
    const b2bService = new B2BService(supabase)
    const b2bClient = await b2bService.getClientByUserId(user.id)
    
    if (b2bClient?.is_active && b2bClient.discount_percentage > 0) {
      b2bDiscount = Math.floor(baseTotal * (b2bClient.discount_percentage / 100))
      baseTotal -= b2bDiscount
    }

    // Handle Credit Limit Check if payment method is 'credit'
    if (data.paymentMethod === 'credit') {
      if (!b2bClient?.is_active || Number(b2bClient.credit_limit) < baseTotal) {
        throw new Error('Crédito insuficiente o cuenta B2B no activa')
      }
    }
  }

  let finalAmount = baseTotal

  // 3. Handle Loyalty Points Redemption
  if (user && data.pointsToRedeem && data.pointsToRedeem > 0) {
    const { LoyaltyService } = await import('@calmar/database')
    const loyaltyService = new LoyaltyService(supabase)
    const userBalance = await loyaltyService.getUserBalance(user.id)

    if (userBalance >= data.pointsToRedeem) {
      redeemedPoints = data.pointsToRedeem
      // 1 point = $1 CLP
      finalAmount = Math.max(0, finalAmount - redeemedPoints)
    }
  }

  // 4. Create Order in Database
  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  // Calculate subtotal (before discounts)
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.product.base_price), 0)
  
  // For now, set tax to 0 (you can calculate IVA if needed: subtotal * 0.19)
  const taxAmount = 0
  
  // Set shipping cost (you may want to make this configurable)
  const shippingCost = 0
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user?.id,
      email: data.customerInfo.email,
      subtotal: subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      discount_amount: b2bDiscount,
      total_amount: finalAmount,
      status: data.paymentMethod === 'credit' ? 'paid' : 'pending_payment',
      shipping_address: {
        name: data.customerInfo.name,
        address: data.customerInfo.address,
        comuna: data.customerInfo.comuna,
        region: data.customerInfo.region,
      },
      billing_address: {
        name: data.customerInfo.name,
        address: data.customerInfo.address,
        comuna: data.customerInfo.comuna,
        region: data.customerInfo.region,
      },
      points_earned: 0, 
      points_redeemed: redeemedPoints,
    })
    .select()
    .single()

  if (orderError) {
    console.error('Order Error:', orderError)
    throw new Error('Error al crear el pedido')
  }

  // 4. Record points redemption if applicable
  if (user && redeemedPoints > 0) {
    const { LoyaltyService } = await import('@calmar/database')
    const loyaltyService = new LoyaltyService(supabase)
    await loyaltyService.redeemPoints(user.id, order.id, redeemedPoints)
  }

  // 5. Create Order Items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.product.id,
    variant_id: item.variant?.id,
    quantity: item.quantity,
    unit_price: item.product.base_price,
    subtotal: item.quantity * item.product.base_price,
    product_name: item.product.name,
    variant_name: item.variant?.name,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  
  if (itemsError) {
    console.error('Items Error:', itemsError)
  }

  // 6. Handle Payment Redirection
  if (data.paymentMethod === 'credit') {
    // 1. Deduct from credit limit
    const { B2BService } = await import('@calmar/database')
    const b2bService = new B2BService(supabase)
    const b2bClient = await b2bService.getClientByUserId(user!.id)
    
    await supabase
      .from('b2b_clients')
      .update({ credit_limit: Number(b2bClient.credit_limit) - finalAmount })
      .eq('id', b2bClient.id)

    // 2. Record payment
    await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        payment_method: 'transfer', // Using 'transfer' as proxy for internal credit for now
        payment_provider: 'internal_credit',
        amount: finalAmount,
        status: 'completed',
      })

    // 3. Award points even for credit orders
    const { LoyaltyService } = await import('@calmar/database')
    const loyaltyService = new LoyaltyService(supabase)
    await loyaltyService.awardPoints(user!.id, order.id, finalAmount)

    // 4. Redirect to success page
    redirect(`/checkout/success?orderId=${order.id}`)
  }

  // 7. Initiate Flow Payment (for non-credit orders)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  let redirectUrl: string | null = null
  
  try {
    const flowPayment = await flow.createPayment({
      commerceOrder: order.id,
      subject: `Pedido #${order.id.slice(0, 8)} - Calmar`,
      amount: finalAmount,
      email: data.customerInfo.email,
      urlConfirmation: `${baseUrl}/api/payments/flow/confirm`,
      urlReturn: `${baseUrl}/api/payments/flow/result`,
    })

    // 8. Update Order with Flow Token
    await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        payment_method: 'flow',
        payment_provider: 'flow',
        amount: finalAmount,
        status: 'pending',
        provider_transaction_id: flowPayment.token,
      })

    // Store redirect URL to use outside try-catch
    redirectUrl = `${flowPayment.url}?token=${flowPayment.token}`

  } catch (error: any) {
    console.error('Flow Error:', error)
    throw new Error('Error al iniciar el pago con Flow')
  }

  // 9. Redirect to Flow (outside try-catch to avoid NEXT_REDIRECT error)
  if (redirectUrl) {
    redirect(redirectUrl)
  }
}
