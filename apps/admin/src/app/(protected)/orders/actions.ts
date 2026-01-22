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
