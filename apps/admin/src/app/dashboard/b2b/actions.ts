
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveB2BClient(clientId: string, data: { discount: number, creditLimit: number }) {
  const supabase = await createClient()

  // 1. Update B2B Client record
  const { data: client, error } = await supabase
    .from('b2b_clients')
    .update({
      is_active: true,
      discount_percentage: data.discount,
      credit_limit: data.creditLimit
    })
    .eq('id', clientId)
    .select('user_id')
    .single()

  if (error) throw error

  // 2. Update User Role
  if (client?.user_id) {
    await supabase
      .from('users')
      .update({ role: 'b2b' })
      .eq('id', client.user_id)
  }

  revalidatePath('/dashboard/b2b')
  return { success: true }
}

export async function updateB2BClient(clientId: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('b2b_clients')
    .update(data)
    .eq('id', clientId)

  if (error) throw error

  revalidatePath('/dashboard/b2b')
  return { success: true }
}
