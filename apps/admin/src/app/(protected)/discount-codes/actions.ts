'use server'

import { createClient } from '@/lib/supabase/server'
import { DiscountCode, DiscountCodeService } from '@calmar/database'
import { revalidatePath } from 'next/cache'

const requireAdmin = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, error: 'No autorizado' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { supabase, error: 'No tienes permisos para realizar esta acción' }
  }

  return { supabase }
}

const normalizePayload = (payload: Partial<DiscountCode>) => {
  return {
    ...payload,
    code: payload.code?.trim().toUpperCase(),
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
    min_purchase_amount: payload.min_purchase_amount ?? null,
    max_discount_amount: payload.max_discount_amount ?? null,
    usage_limit: payload.usage_limit ?? null,
    per_user_limit: payload.per_user_limit ?? 1,
    starts_at: payload.starts_at || null,
    expires_at: payload.expires_at || null,
  }
}

export async function getDiscountCodeDetail(id: string) {
  const { supabase, error } = await requireAdmin()
  if (error) {
    return { error, data: null }
  }

  try {
    const service = new DiscountCodeService(supabase)
    const data = await service.getDiscountCodeById(id)

    const { data: productLinks } = await supabase
      .from('discount_code_products')
      .select('product_id')
      .eq('discount_code_id', id)

    const { data: userLinks } = await supabase
      .from('discount_code_users')
      .select('user_id')
      .eq('discount_code_id', id)

    return {
      data,
      productIds: (productLinks || []).map((p: any) => p.product_id),
      userIds: (userLinks || []).map((u: any) => u.user_id),
    }
  } catch (detailError: any) {
    console.error('Error fetching discount code detail:', detailError)
    return { error: detailError?.message || 'Error al cargar el código', data: null }
  }
}

const syncRelations = async (supabase: any, codeId: string, productIds: string[], userIds: string[]) => {
  await supabase
    .from('discount_code_products')
    .delete()
    .eq('discount_code_id', codeId)

  await supabase
    .from('discount_code_users')
    .delete()
    .eq('discount_code_id', codeId)

  if (productIds.length > 0) {
    const payload = productIds.map(productId => ({
      discount_code_id: codeId,
      product_id: productId,
    }))
    await supabase.from('discount_code_products').insert(payload)
  }

  if (userIds.length > 0) {
    const payload = userIds.map(userId => ({
      discount_code_id: codeId,
      user_id: userId,
    }))
    await supabase.from('discount_code_users').insert(payload)
  }
}

export async function createDiscountCodeAction(
  payload: Partial<DiscountCode>,
  productIds: string[],
  userIds: string[]
) {
  const { supabase, error } = await requireAdmin()
  if (error) {
    return { error }
  }

  try {
    const service = new DiscountCodeService(supabase)
    const normalized = normalizePayload(payload)
    const created = await service.createDiscountCode(normalized)

    await syncRelations(supabase, created.id, productIds, userIds)

    revalidatePath('/discount-codes')
    return { success: true, id: created.id }
  } catch (createError: any) {
    console.error('Error creating discount code:', createError)
    return { error: createError?.message || 'Error al crear el código' }
  }
}

export async function updateDiscountCodeAction(
  id: string,
  payload: Partial<DiscountCode>,
  productIds: string[],
  userIds: string[]
) {
  const { supabase, error } = await requireAdmin()
  if (error) {
    return { error }
  }

  try {
    const service = new DiscountCodeService(supabase)
    const normalized = normalizePayload(payload)
    await service.updateDiscountCode(id, normalized)
    await syncRelations(supabase, id, productIds, userIds)

    revalidatePath('/discount-codes')
    revalidatePath(`/discount-codes/${id}`)
    return { success: true }
  } catch (updateError: any) {
    console.error('Error updating discount code:', updateError)
    return { error: updateError?.message || 'Error al actualizar el código' }
  }
}

export async function deleteDiscountCodeAction(id: string) {
  const { supabase, error } = await requireAdmin()
  if (error) {
    return { error }
  }

  try {
    const service = new DiscountCodeService(supabase)
    await service.deleteDiscountCode(id)

    revalidatePath('/discount-codes')
    return { success: true }
  } catch (deleteError: any) {
    console.error('Error deleting discount code:', deleteError)
    return { error: deleteError?.message || 'Error al eliminar el código' }
  }
}
