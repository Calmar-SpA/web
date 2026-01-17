'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: (formData.get('name') as string)?.trim(),
    contact_name: (formData.get('contact_name') as string)?.trim() || null,
    contact_email: (formData.get('contact_email') as string)?.trim() || null,
    contact_phone: (formData.get('contact_phone') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }

  if (!payload.name) {
    throw new Error('El nombre del proveedor es obligatorio')
  }

  const { error } = await supabase
    .from('suppliers')
    .insert(payload)

  if (error) throw error

  revalidatePath('/suppliers')
  return { success: true }
}

export async function toggleSupplierStatus(supplierId: string, currentIsActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: !currentIsActive })
    .eq('id', supplierId)

  if (error) throw error

  revalidatePath('/suppliers')
  return { success: true }
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: (formData.get('name') as string)?.trim(),
    contact_name: (formData.get('contact_name') as string)?.trim() || null,
    contact_email: (formData.get('contact_email') as string)?.trim() || null,
    contact_phone: (formData.get('contact_phone') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }

  if (!payload.name) {
    throw new Error('El nombre del proveedor es obligatorio')
  }

  const { error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', supplierId)

  if (error) throw error

  revalidatePath('/suppliers')
  revalidatePath(`/suppliers/${supplierId}`)
  redirect(`/suppliers/${supplierId}?success=supplier_updated`)
}

export async function createSupplierItem(supplierId: string, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    supplier_id: supplierId,
    item_type: (formData.get('item_type') as string) || 'producto',
    name: (formData.get('name') as string)?.trim(),
    cost_price: Number(formData.get('cost_price')),
    notes: (formData.get('notes') as string)?.trim() || null,
    is_active: formData.get('is_active') === 'on',
  }

  if (!payload.name) {
    throw new Error('El nombre es obligatorio')
  }

  if (!Number.isFinite(payload.cost_price) || payload.cost_price < 0) {
    throw new Error('El costo no puede ser negativo')
  }

  const { error } = await supabase
    .from('supplier_items')
    .insert(payload)

  if (error) {
    console.error('Error creating supplier item:', error)
    throw new Error(`Error al guardar: ${error.message}`)
  }

  revalidatePath(`/suppliers/${supplierId}`)
  redirect(`/suppliers/${supplierId}?success=created`)
}

export async function updateSupplierItem(itemId: string, supplierId: string, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    item_type: (formData.get('item_type') as string) || 'producto',
    name: (formData.get('name') as string)?.trim(),
    cost_price: Number(formData.get('cost_price')),
    notes: (formData.get('notes') as string)?.trim() || null,
    is_active: formData.get('is_active') === 'on',
  }

  if (!payload.name) {
    throw new Error('El nombre es obligatorio')
  }

  if (!Number.isFinite(payload.cost_price) || payload.cost_price < 0) {
    throw new Error('El costo no puede ser negativo')
  }

  const { error } = await supabase
    .from('supplier_items')
    .update(payload)
    .eq('id', itemId)

  if (error) {
    console.error('Error updating supplier item:', error)
    throw new Error(`Error al actualizar: ${error.message}`)
  }

  revalidatePath(`/suppliers/${supplierId}`)
  redirect(`/suppliers/${supplierId}?success=updated`)
}

export async function duplicateSupplierItem(itemId: string, supplierId: string) {
  const supabase = await createClient()

  const { data: item, error: fetchError } = await supabase
    .from('supplier_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (fetchError || !item) {
    throw new Error('Item no encontrado')
  }

  const { error } = await supabase
    .from('supplier_items')
    .insert({
      supplier_id: item.supplier_id,
      item_type: item.item_type,
      name: `${item.name} (copia)`,
      cost_price: item.cost_price,
      notes: item.notes,
      is_active: item.is_active,
    })

  if (error) {
    console.error('Error duplicating supplier item:', error)
    throw new Error(`Error al copiar: ${error.message}`)
  }

  revalidatePath(`/suppliers/${supplierId}`)
  redirect(`/suppliers/${supplierId}?success=duplicated`)
}

export async function deleteSupplierItem(itemId: string, supplierId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('supplier_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting supplier item:', error)
    throw new Error(`Error al eliminar: ${error.message}`)
  }

  revalidatePath(`/suppliers/${supplierId}`)
  redirect(`/suppliers/${supplierId}?success=deleted`)
}