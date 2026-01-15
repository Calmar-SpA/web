
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { B2BService } from '@calmar/database'
import { sendB2BApprovedEmail, sendB2BRejectedEmail } from '@/lib/mail'

type FixedPriceInput = { productId: string; fixedPrice: number }

const normalizeFixedPrices = (prices: FixedPriceInput[] = [], clientId: string) => {
  return prices
    .map(price => ({
      b2b_client_id: clientId,
      product_id: price.productId,
      fixed_price: Number(price.fixedPrice)
    }))
    .filter(price => price.product_id && Number.isFinite(price.fixed_price) && price.fixed_price > 0)
}

const syncB2BProductPrices = async (supabase: any, clientId: string, fixedPrices: FixedPriceInput[]) => {
  const normalized = normalizeFixedPrices(fixedPrices, clientId)

  if (normalized.length === 0) {
    const { error } = await supabase
      .from('b2b_product_prices')
      .delete()
      .eq('b2b_client_id', clientId)

    if (error) throw error
    return
  }

  const productIds = normalized.map(price => `"${price.product_id}"`).join(',')

  const { error: deleteError } = await supabase
    .from('b2b_product_prices')
    .delete()
    .eq('b2b_client_id', clientId)
    .not('product_id', 'in', `(${productIds})`)

  if (deleteError) throw deleteError

  const { error: upsertError } = await supabase
    .from('b2b_product_prices')
    .upsert(normalized, { onConflict: 'b2b_client_id,product_id' })

  if (upsertError) throw upsertError
}

export async function approveB2BClient(
  clientId: string,
  data: { creditLimit: number, paymentTermsDays?: number },
  fixedPrices: FixedPriceInput[]
) {
  const supabase = await createClient()

  // 1. Update B2B Client record
  const { data: client, error } = await supabase
    .from('b2b_clients')
    .update({
      is_active: true,
      status: 'approved',
      credit_limit: data.creditLimit,
      payment_terms_days: data.paymentTermsDays || 30
    })
    .eq('id', clientId)
    .select('user_id, contact_email, contact_name, company_name, credit_limit, payment_terms_days')
    .single()

  if (error) throw error

  // 2. Update User Role
  if (client?.user_id) {
    await supabase
      .from('users')
      .update({ role: 'b2b' })
      .eq('id', client.user_id)
  }

  await syncB2BProductPrices(supabase, clientId, fixedPrices)

  if (client?.contact_email) {
    await sendB2BApprovedEmail({
      contactName: client.contact_name || 'Cliente',
      contactEmail: client.contact_email,
      companyName: client.company_name || 'Empresa',
      creditLimit: Number(client.credit_limit || data.creditLimit),
      paymentTermsDays: Number(client.payment_terms_days || data.paymentTermsDays || 30),
    })
  }

  revalidatePath('/dashboard/b2b')
  return { success: true }
}

export async function rejectB2BClient(clientId: string) {
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('b2b_clients')
    .update({
      status: 'rejected',
      is_active: false
    })
    .eq('id', clientId)
    .select('contact_email, contact_name, company_name')
    .single()

  if (error) throw error

  if (client?.contact_email) {
    await sendB2BRejectedEmail({
      contactName: client.contact_name || 'Cliente',
      contactEmail: client.contact_email,
      companyName: client.company_name || 'Empresa',
    })
  }

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

export async function updateB2BClient(
  clientId: string,
  data: { credit_limit: number; payment_terms_days: number },
  fixedPrices: FixedPriceInput[]
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('b2b_clients')
    .update(data)
    .eq('id', clientId)

  if (error) throw error

  await syncB2BProductPrices(supabase, clientId, fixedPrices)

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
