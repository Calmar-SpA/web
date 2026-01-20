'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const toNumber = (value: FormDataEntryValue | null, fallback = 0) => {
  if (value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toStringOrNull = (value: FormDataEntryValue | null) => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed ? trimmed : null
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: (formData.get('name') as string)?.trim(),
    description: toStringOrNull(formData.get('description')),
    color: toStringOrNull(formData.get('color')),
    is_active: formData.get('is_active') === 'on',
  }

  if (!payload.name) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  const { error } = await supabase.from('purchase_categories').insert(payload)
  if (error) throw error

  revalidatePath('/purchases/categories')
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: (formData.get('name') as string)?.trim(),
    description: toStringOrNull(formData.get('description')),
    color: toStringOrNull(formData.get('color')),
    is_active: formData.get('is_active') === 'on',
  }

  if (!payload.name) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  const { error } = await supabase
    .from('purchase_categories')
    .update(payload)
    .eq('id', categoryId)

  if (error) throw error

  revalidatePath('/purchases/categories')
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('purchase_categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error

  revalidatePath('/purchases/categories')
}

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()

  const netAmount = toNumber(formData.get('net_amount'))
  const taxAmount = toNumber(formData.get('tax_amount'))
  const totalAmount = Number.isFinite(netAmount + taxAmount) ? netAmount + taxAmount : 0

  const payload = {
    category_id: (formData.get('category_id') as string) || null,
    description: (formData.get('description') as string)?.trim(),
    net_amount: netAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    invoice_number: toStringOrNull(formData.get('invoice_number')),
    purchase_date: (formData.get('purchase_date') as string) || null,
    payment_status: (formData.get('payment_status') as string) || 'pending',
    payment_method: toStringOrNull(formData.get('payment_method')),
    notes: toStringOrNull(formData.get('notes')),
  }

  if (!payload.category_id) {
    throw new Error('La categoría es obligatoria')
  }
  if (!payload.description) {
    throw new Error('La descripción es obligatoria')
  }
  if (!Number.isFinite(payload.net_amount) || payload.net_amount < 0) {
    throw new Error('El monto neto no es válido')
  }

  const { data, error } = await supabase
    .from('purchases')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error

  revalidatePath('/purchases')
  redirect(`/purchases/${data.id}?success=created`)
}

export async function updatePurchase(purchaseId: string, formData: FormData) {
  const supabase = await createClient()

  const netAmount = toNumber(formData.get('net_amount'))
  const taxAmount = toNumber(formData.get('tax_amount'))
  const totalAmount = Number.isFinite(netAmount + taxAmount) ? netAmount + taxAmount : 0

  const payload = {
    category_id: (formData.get('category_id') as string) || null,
    description: (formData.get('description') as string)?.trim(),
    net_amount: netAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    invoice_number: toStringOrNull(formData.get('invoice_number')),
    purchase_date: (formData.get('purchase_date') as string) || null,
    payment_status: (formData.get('payment_status') as string) || 'pending',
    payment_method: toStringOrNull(formData.get('payment_method')),
    notes: toStringOrNull(formData.get('notes')),
  }

  if (!payload.category_id) {
    throw new Error('La categoría es obligatoria')
  }
  if (!payload.description) {
    throw new Error('La descripción es obligatoria')
  }
  if (!Number.isFinite(payload.net_amount) || payload.net_amount < 0) {
    throw new Error('El monto neto no es válido')
  }

  const { error } = await supabase
    .from('purchases')
    .update(payload)
    .eq('id', purchaseId)

  if (error) throw error

  revalidatePath('/purchases')
  revalidatePath(`/purchases/${purchaseId}`)
  redirect(`/purchases/${purchaseId}?success=updated`)
}

export async function deletePurchase(purchaseId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', purchaseId)

  if (error) throw error

  revalidatePath('/purchases')
  redirect('/purchases?success=deleted')
}

export async function createDelivery(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    purchase_id: (formData.get('purchase_id') as string) || null,
    prospect_id: toStringOrNull(formData.get('prospect_id')),
    item_type: (formData.get('item_type') as string)?.trim(),
    quantity: toNumber(formData.get('quantity')),
    delivery_address: toStringOrNull(formData.get('delivery_address')),
    delivery_status: (formData.get('delivery_status') as string) || 'pending',
    scheduled_date: (formData.get('scheduled_date') as string) || null,
    delivered_date: (formData.get('delivered_date') as string) || null,
    notes: toStringOrNull(formData.get('notes')),
  }

  if (!payload.purchase_id) {
    throw new Error('La compra es obligatoria')
  }
  if (!payload.prospect_id) {
    throw new Error('El cliente es obligatorio')
  }
  if (!payload.item_type) {
    throw new Error('El tipo de material es obligatorio')
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  const { error } = await supabase
    .from('marketing_deliveries')
    .insert(payload)

  if (error) throw error

  revalidatePath(`/purchases/${payload.purchase_id}`)
  redirect(`/purchases/${payload.purchase_id}?success=delivery_created`)
}

export async function updateDelivery(deliveryId: string, purchaseId: string, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    prospect_id: toStringOrNull(formData.get('prospect_id')),
    item_type: (formData.get('item_type') as string)?.trim(),
    quantity: toNumber(formData.get('quantity')),
    delivery_address: toStringOrNull(formData.get('delivery_address')),
    delivery_status: (formData.get('delivery_status') as string) || 'pending',
    scheduled_date: (formData.get('scheduled_date') as string) || null,
    delivered_date: (formData.get('delivered_date') as string) || null,
    notes: toStringOrNull(formData.get('notes')),
  }

  if (!payload.prospect_id) {
    throw new Error('El cliente es obligatorio')
  }
  if (!payload.item_type) {
    throw new Error('El tipo de material es obligatorio')
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  const { error } = await supabase
    .from('marketing_deliveries')
    .update(payload)
    .eq('id', deliveryId)

  if (error) throw error

  revalidatePath(`/purchases/${purchaseId}`)
  redirect(`/purchases/${purchaseId}?success=delivery_updated`)
}

export async function addDeliveryPhoto(deliveryId: string, purchaseId: string, formData: FormData) {
  const supabase = await createClient()

  const photoUrl = (formData.get('photo_url') as string)?.trim()
  if (!photoUrl) {
    throw new Error('La URL de la foto es obligatoria')
  }

  const { data: delivery, error: fetchError } = await supabase
    .from('marketing_deliveries')
    .select('photo_urls')
    .eq('id', deliveryId)
    .single()

  if (fetchError) throw fetchError

  const photoUrls = Array.isArray(delivery?.photo_urls) ? delivery.photo_urls : []
  if (!photoUrls.includes(photoUrl)) {
    photoUrls.push(photoUrl)
  }

  const { error } = await supabase
    .from('marketing_deliveries')
    .update({ photo_urls: photoUrls })
    .eq('id', deliveryId)

  if (error) throw error

  revalidatePath(`/purchases/${purchaseId}`)
  redirect(`/purchases/${purchaseId}?success=photo_added`)
}

export async function deleteDelivery(deliveryId: string, purchaseId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('marketing_deliveries')
    .delete()
    .eq('id', deliveryId)

  if (error) throw error

  revalidatePath(`/purchases/${purchaseId}`)
  redirect(`/purchases/${purchaseId}?success=delivery_deleted`)
}
