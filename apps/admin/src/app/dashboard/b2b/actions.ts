
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { B2BService } from '@calmar/database'

export async function approveB2BClient(clientId: string, data: { discount: number, creditLimit: number, paymentTermsDays?: number }) {
  const supabase = await createClient()

  // 1. Update B2B Client record
  const { data: client, error } = await supabase
    .from('b2b_clients')
    .update({
      is_active: true,
      status: 'approved',
      discount_percentage: data.discount,
      credit_limit: data.creditLimit,
      payment_terms_days: data.paymentTermsDays || 30
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

export async function rejectB2BClient(clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('b2b_clients')
    .update({
      status: 'rejected',
      is_active: false
    })
    .eq('id', clientId)

  if (error) throw error

  revalidatePath('/dashboard/b2b')
  return { success: true }
}

export async function toggleB2BClientStatus(clientId: string, currentIsActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('b2b_clients')
    .update({
      is_active: !currentIsActive
    })
    .eq('id', clientId)

  if (error) throw error

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

export async function getB2BClientOrders(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getB2BApiKeys(clientId: string) {
  const supabase = await createClient()
  const b2bService = new B2BService(supabase)
  return await b2bService.getApiKeys(clientId)
}

export async function createB2BApiKey(clientId: string, name: string) {
  const supabase = await createClient()
  const b2bService = new B2BService(supabase)
  const key = await b2bService.createApiKey(clientId, name)
  
  revalidatePath('/dashboard/b2b')
  return { success: true, key }
}

export async function revokeB2BApiKey(keyId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('b2b_api_keys')
    .update({ is_active: false })
    .eq('id', keyId)

  if (error) throw error

  revalidatePath('/dashboard/b2b')
  return { success: true }
}
