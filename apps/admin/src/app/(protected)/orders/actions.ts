'use server'

import { createClient } from '@/lib/supabase/server'
import { OrderService } from '@calmar/database'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  const orderService = new OrderService(supabase)
  
  await orderService.updateOrderStatus(orderId, status)
  
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}

export async function createOrderForUser(data: {
  user_id: string
  items: { product_id: string; quantity: number; unit_price: number; product_name?: string }[]
  shipping_address: {
    name: string
    rut: string
    address: string
    comuna: string
    region: string
    phone?: string
  }
  is_business_order: boolean
  status: 'pending_payment' | 'paid'
  notes?: string
}) {
  const supabase = await createClient()
  
  // Verify user exists
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('id', data.user_id)
    .single()

  if (userError || !userData) {
    throw new Error('Usuario no encontrado')
  }

  // Calculate total
  const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: data.user_id,
      order_number: orderNumber,
      customer_name: userData.full_name || userData.email,
      customer_email: userData.email,
      shipping_address: data.shipping_address,
      total_amount: totalAmount,
      status: data.status,
      is_business_order: data.is_business_order,
      notes: data.notes || null
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw new Error('Error al crear la orden: ' + orderError.message)
  }

  // Create order items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name || 'Producto',
    quantity: item.quantity,
    unit_price: item.unit_price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    // Try to delete the order if items creation failed
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error('Error al crear los items de la orden: ' + itemsError.message)
  }

  // If status is paid, create a payment record
  if (data.status === 'paid') {
    await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: totalAmount,
        status: 'completed',
        payment_provider: 'manual_admin',
        provider_transaction_id: `ADMIN-${Date.now()}`
      })
  }

  revalidatePath('/orders')
  return order
}