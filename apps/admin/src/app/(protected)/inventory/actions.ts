'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function syncInventory() {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.rpc('recalculate_all_inventory')
    
    if (error) throw error

    revalidatePath('/inventory')
    revalidatePath('/products')
    return { success: true }
  } catch (error: any) {
    console.error('Error syncing inventory:', error)
    return { success: false, error: error.message }
  }
}

export async function createStockEntry(formData: FormData) {
  const supabase = await createClient()

  const quantity = Number(formData.get('quantity'))
  const unitCost = Number(formData.get('unit_cost'))
  const invoicedDateInput = (formData.get('invoiced_at') as string) || ''
  const paidDateInput = (formData.get('paid_at') as string) || ''
  const isInvoiced = formData.get('is_invoiced') === 'on' || Boolean(invoicedDateInput)
  const isPaid = formData.get('is_paid') === 'on' || Boolean(paidDateInput)
  const invoicedAt = invoicedDateInput ? new Date(invoicedDateInput).toISOString() : null
  const paidAt = paidDateInput ? new Date(paidDateInput).toISOString() : null

  const payload = {
    product_id: formData.get('product_id') as string,
    variant_id: (formData.get('variant_id') as string) || null,
    supplier_id: formData.get('supplier_id') as string,
    quantity,
    unit_cost: unitCost,
    entry_date: (formData.get('entry_date') as string) || null,
    expiration_date: (formData.get('expiration_date') as string) || null,
    notes: (formData.get('notes') as string)?.trim() || null,
    invoice_number: (formData.get('invoice_number') as string)?.trim() || null,
    is_invoiced: isInvoiced,
    is_paid: isPaid,
    invoiced_at: isInvoiced ? (invoicedAt || new Date().toISOString()) : null,
    paid_at: isPaid ? (paidAt || new Date().toISOString()) : null,
  }

  if (!payload.product_id || !payload.supplier_id) {
    throw new Error('Producto y proveedor son obligatorios')
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  if (!Number.isFinite(unitCost) || unitCost < 0) {
    throw new Error('El costo unitario no puede ser negativo')
  }

  const { error } = await supabase
    .from('stock_entries')
    .insert(payload)

  if (error) throw error

  revalidatePath('/inventory')
  redirect('/inventory?success=created')
}

export async function updateStockEntry(entryId: string, formData: FormData) {
  const supabase = await createClient()

  const quantity = Number(formData.get('quantity'))
  const unitCost = Number(formData.get('unit_cost'))
  const invoicedDateInput = (formData.get('invoiced_at') as string) || ''
  const paidDateInput = (formData.get('paid_at') as string) || ''
  const isInvoiced = formData.get('is_invoiced') === 'on' || Boolean(invoicedDateInput)
  const isPaid = formData.get('is_paid') === 'on' || Boolean(paidDateInput)
  const invoicedAt = invoicedDateInput ? new Date(invoicedDateInput).toISOString() : null
  const paidAt = paidDateInput ? new Date(paidDateInput).toISOString() : null

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  if (!Number.isFinite(unitCost) || unitCost < 0) {
    throw new Error('El costo unitario no puede ser negativo')
  }

  const payload = {
    quantity,
    unit_cost: unitCost,
    expiration_date: (formData.get('expiration_date') as string) || null,
    notes: (formData.get('notes') as string)?.trim() || null,
    invoice_number: (formData.get('invoice_number') as string)?.trim() || null,
    is_invoiced: isInvoiced,
    is_paid: isPaid,
    invoiced_at: isInvoiced ? (invoicedAt || new Date().toISOString()) : null,
    paid_at: isPaid ? (paidAt || new Date().toISOString()) : null,
  }

  const { error } = await supabase
    .from('stock_entries')
    .update(payload)
    .eq('id', entryId)

  if (error) throw error

  revalidatePath('/inventory')
  redirect('/inventory?success=updated')
}
