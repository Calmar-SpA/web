'use server'

import { createClient } from '@/lib/supabase/server'
import { flow } from '@/lib/flow'
import { sendOrderPaidAdminEmail, sendOrderPaidCustomerEmail } from '@/lib/mail'
import { notifyLowInventoryIfNeeded } from '@/lib/inventory-alerts'
import { formatRut, normalizeRut, isValidRut } from '@calmar/utils'
import { B2BService, LoyaltyService } from '@calmar/database'

interface CheckoutData {
  items: any[];
  customerInfo: {
    name: string;
    email: string;
    rut?: string;
    address: string;
    comuna: string;
    region: string;
  };
  total: number;
  pointsToRedeem?: number;
  paymentMethod?: 'flow' | 'credit';
  shippingCost?: number;
  shippingServiceCode?: string;
  shippingServiceName?: string;
}

export async function checkNewsletterDiscount(email: string) {
  console.log('[checkNewsletterDiscount] Checking for email:', email)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('discount_percentage, discount_expires_at')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  console.log('[checkNewsletterDiscount] Query result:', { data, error })

  if (error || !data) {
    console.log('[checkNewsletterDiscount] Returning null due to error or no data')
    return null
  }

  const now = new Date()
  const expiresAt = new Date(data.discount_expires_at)
  
  console.log('[checkNewsletterDiscount] Dates:', { now, expiresAt, isExpired: now > expiresAt })
  
  if (now > expiresAt) {
    console.log('[checkNewsletterDiscount] Discount expired')
    return null
  }
  
  console.log('[checkNewsletterDiscount] Returning discount:', data.discount_percentage)
  return data.discount_percentage
}

interface PaymentResult {
  success: boolean;
  redirectUrl?: string;
  orderId?: string;
  error?: string;
}

export async function createOrderAndInitiatePayment(data: CheckoutData): Promise<PaymentResult> {
  const supabase = await createClient()
  
  // 1. Get current user (if logged in)
  const { data: { user } } = await supabase.auth.getUser()

  const inputRutNormalized = normalizeRut(data.customerInfo.rut)
  const inputRutFormatted = inputRutNormalized ? formatRut(inputRutNormalized) : null
  let userRutFormatted: string | null = null
  let prospectRutNormalized: string | null = null
  let prospectRutFormatted: string | null = null
  let didUpdateRut = false

  if (data.customerInfo.rut && !isValidRut(data.customerInfo.rut)) {
    throw new Error('El RUT no es válido')
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, rut')
      .eq('id', user.id)
      .single()

    const storedRutNormalized = normalizeRut(profile?.rut)
    const storedRutFormatted = storedRutNormalized ? formatRut(storedRutNormalized) : null

    if (storedRutFormatted && profile?.rut !== storedRutFormatted) {
      await supabase
        .from('users')
        .update({ rut: storedRutFormatted })
        .eq('id', user.id)
    }

    if (!inputRutNormalized && !storedRutNormalized) {
      throw new Error('Debes ingresar tu RUT para continuar')
    }

    if (inputRutNormalized && inputRutNormalized !== storedRutNormalized) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('rut', inputRutFormatted)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        throw new Error('Este RUT ya está asociado a otra cuenta')
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ rut: inputRutFormatted })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('No se pudo guardar el RUT en tu perfil')
      }

      userRutFormatted = inputRutFormatted
      didUpdateRut = true
    } else {
      userRutFormatted = storedRutFormatted
    }
  } else if (!inputRutNormalized) {
    throw new Error('Debes ingresar tu RUT para continuar')
  }

  prospectRutNormalized = inputRutNormalized || (userRutFormatted ? normalizeRut(userRutFormatted) : null)
  prospectRutFormatted = userRutFormatted || inputRutFormatted
  let prospectId: string | null = null

  if (prospectRutNormalized) {
    const { data: prospect } = await supabase
      .rpc('get_or_create_prospect_for_order', {
        rut_input: prospectRutNormalized,
        email_input: data.customerInfo.email,
        name_input: data.customerInfo.name,
        user_id_input: user?.id || null
      })

    prospectId = prospect || null
  }

  let baseTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.product.base_price), 0)
  let newsletterDiscountAmount = 0
  let redeemedPoints = 0

  // 1.5 Handle Newsletter Discount (Only if NOT B2B as per user request)
  const newsletterDiscountPercent = await checkNewsletterDiscount(data.customerInfo.email)

  // 2. Handle B2B Discount
  let b2bPriceMap = new Map<string, number>()
  if (user) {
    const b2bService = new B2BService(supabase)
    const b2bClient = await b2bService.getClientByUserId(user.id)
    
    if (b2bClient?.is_active) {
      const { data: b2bPrices, error: b2bPricesError } = await supabase
        .from('b2b_product_prices')
        .select('product_id, fixed_price')
        .eq('b2b_client_id', b2bClient.id)

      if (b2bPricesError) throw b2bPricesError

      b2bPriceMap = new Map(
        (b2bPrices || []).map(price => [price.product_id, Number(price.fixed_price)])
      )

      const b2bSubtotal = data.items.reduce((sum, item) => {
        const fixedPrice = b2bPriceMap.get(item.product.id)
        const unitPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
          ? fixedPrice
          : item.product.base_price
        return sum + (item.quantity * unitPrice)
      }, 0)

      baseTotal = b2bSubtotal
    }

    // Apply newsletter discount only if NOT B2B pricing
    if (!b2bClient?.is_active && newsletterDiscountPercent && newsletterDiscountPercent > 0) {
      newsletterDiscountAmount = Math.floor(baseTotal * (Number(newsletterDiscountPercent) / 100))
      baseTotal -= newsletterDiscountAmount
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
  
  // Calculate subtotal using final unit prices
  const subtotal = data.items.reduce((sum, item) => {
    const fixedPrice = b2bPriceMap.get(item.product.id)
    const unitPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
      ? fixedPrice
      : item.product.base_price
    return sum + (item.quantity * unitPrice)
  }, 0)
  
  // For now, set tax to 0 (you can calculate IVA if needed: subtotal * 0.19)
  const taxAmount = 0
  
  // Use shipping cost from Chilexpress quote
  const shippingCost = data.shippingCost || 0
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user?.id,
      prospect_id: prospectId,
      email: data.customerInfo.email,
      subtotal: subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      discount_amount: newsletterDiscountAmount,
      total_amount: finalAmount + shippingCost,
      status: data.paymentMethod === 'credit' ? 'paid' : 'pending_payment',
      shipping_address: {
        name: data.customerInfo.name,
        rut: prospectRutFormatted,
        address: data.customerInfo.address,
        comuna: data.customerInfo.comuna,
        region: data.customerInfo.region,
        rut_updated: didUpdateRut,
      },
      billing_address: {
        name: data.customerInfo.name,
        rut: prospectRutFormatted,
        address: data.customerInfo.address,
        comuna: data.customerInfo.comuna,
        region: data.customerInfo.region,
        rut_updated: didUpdateRut,
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
    const loyaltyService = new LoyaltyService(supabase)
    await loyaltyService.redeemPoints(user.id, order.id, redeemedPoints)
  }

  // 5. Create Order Items
  const orderItems = data.items.map(item => {
    const fixedPrice = b2bPriceMap.get(item.product.id)
    const unitPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
      ? fixedPrice
      : item.product.base_price
    const lineSubtotal = item.quantity * unitPrice

    return {
    order_id: order.id,
    product_id: item.product.id,
    variant_id: item.variant?.id,
    quantity: item.quantity,
      unit_price: unitPrice,
      subtotal: lineSubtotal,
    product_name: item.product.name,
    variant_name: item.variant?.name,
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  
  if (itemsError) {
    console.error('Items Error:', itemsError)
  }

  // 6. Handle Payment Redirection
  if (data.paymentMethod === 'credit') {
    // 1. Deduct from credit limit
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
    const loyaltyService = new LoyaltyService(supabase)
    await loyaltyService.awardPoints(user!.id, order.id, finalAmount)

    const shippingSummary = `${data.customerInfo.address}, ${data.customerInfo.comuna}, ${data.customerInfo.region}`
    const emailItems = orderItems.map(item => ({
      name: item.product_name,
      variantName: item.variant_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }))

    await sendOrderPaidCustomerEmail({
      email: data.customerInfo.email,
      customerName: data.customerInfo.name,
      orderNumber: order.order_number,
      orderId: order.id,
      orderStatusLabel: 'pagado',
      totalAmount: Number(order.total_amount),
      items: emailItems,
    })

    await sendOrderPaidAdminEmail({
      orderNumber: order.order_number,
      customerName: data.customerInfo.name,
      customerEmail: data.customerInfo.email,
      totalAmount: Number(order.total_amount),
      paymentMethod: 'Credito B2B',
      shippingSummary,
    })

    await notifyLowInventoryIfNeeded(supabase, orderItems)

    // 4. Return success for redirect (client-side will handle navigation)
    const successParams = new URLSearchParams({ orderId: order.id })
    if (didUpdateRut) {
      successParams.set('rutUpdated', '1')
    }
    return {
      success: true,
      redirectUrl: `/checkout/success?${successParams.toString()}`,
      orderId: order.id,
    }
  }

  // 7. Initiate Flow Payment (for non-credit orders)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  
  // Total amount including shipping
  const totalWithShipping = finalAmount + shippingCost
  
  const flowPayment = await flow.createPayment({
    commerceOrder: order.id,
    subject: `Pedido #${order.id.slice(0, 8)} - Calmar`,
    amount: totalWithShipping,
    email: data.customerInfo.email,
    urlConfirmation: `${baseUrl}/api/payments/flow/confirm`,
    urlReturn: `${baseUrl}/api/payments/flow/result`,
  })

  // 8. Record Flow payment
  await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      payment_method: 'flow',
      payment_provider: 'flow',
      amount: totalWithShipping,
      status: 'pending',
      provider_transaction_id: flowPayment.token,
    })

  // 9. Return Flow payment URL for client-side redirect (more reliable for external URLs)
  return {
    success: true,
    redirectUrl: `${flowPayment.url}?token=${flowPayment.token}`,
    orderId: order.id,
  }
}
