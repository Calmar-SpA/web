'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeRut, isValidRut } from '@calmar/utils'

export type CompleteProfileState = {
  success: boolean
  error?: 'session' | 'full_name' | 'rut' | 'rut_exists' | 'server'
  full_name?: string
  rut?: string
}

export async function completeProfile(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { success: false, error: 'session' }
  }

  console.log('[COMPLETE_PROFILE] Starting for user:', user.id, user.email)

  // Usar cliente admin para bypasear RLS (usuarios con deleted_at no pueden verse a sí mismos)
  const adminClient = createAdminClient()

  // Verificar estado actual del usuario
  const { data: currentUser, error: fetchError } = await adminClient
    .from('users')
    .select('id, deleted_at, full_name, rut')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    console.error('[COMPLETE_PROFILE] Error fetching current user:', fetchError)
  } else {
    console.log('[COMPLETE_PROFILE] Current user state:', {
      has_deleted_at: !!currentUser?.deleted_at,
      has_full_name: !!currentUser?.full_name,
      has_rut: !!currentUser?.rut
    })
  }

  const fullNameInput = String(formData.get('full_name') || '').trim()
  const nameParts = fullNameInput.split(/\s+/).filter(Boolean)

  if (nameParts.length < 2) {
    return { success: false, error: 'full_name' }
  }

  const rutInput = String(formData.get('rut') || '').trim()
  const rut = normalizeRut(rutInput)

  if (!rut || !isValidRut(rut)) {
    return { success: false, error: 'rut' }
  }

  // PRIMERO: Verificar si existe un registro con este email (puede tener ID diferente por re-registro)
  const { data: existingByEmail } = await adminClient
    .from('users')
    .select('id, rut, email')
    .eq('email', user.email)
    .single()

  // Verificar si el RUT ya existe con OTRO usuario (diferente email)
  const { data: existingUserByRut, error: checkError } = await adminClient
    .from('users')
    .select('id, email')
    .eq('rut', rut)
    .neq('id', user.id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('[COMPLETE_PROFILE] Error checking RUT:', checkError)
  }

  // Solo es error si el RUT pertenece a un usuario con DIFERENTE email
  // Si es el mismo email, es un re-registro válido
  if (existingUserByRut && existingUserByRut.email !== user.email) {
    console.log('[COMPLETE_PROFILE] RUT already exists with different email:', rut, existingUserByRut.email)
    return { success: false, error: 'rut_exists' }
  }

  if (existingByEmail && existingByEmail.id !== user.id) {
    // RE-REGISTRO: El usuario existe por email pero con ID diferente
    // Migrar referencias del ID antiguo al nuevo ID de auth
    const oldId = existingByEmail.id
    const newId = user.id

    console.log('[COMPLETE_PROFILE] Re-registration detected. Old ID:', oldId, '-> New ID:', newId)
    
    // Obtener datos completos del usuario antiguo para preservar role, points, etc.
    const { data: oldUserData } = await adminClient
      .from('users')
      .select('role, points_balance, shipping_fee_exempt, address, address_number, address_extra, comuna, region')
      .eq('id', oldId)
      .single()

    console.log('[COMPLETE_PROFILE] Old user data:', oldUserData ? 'found' : 'not found')

    // PASO 1: Limpiar email y rut del usuario antiguo (para evitar conflictos de unique)
    console.log('[COMPLETE_PROFILE] Step 1: Clearing unique fields from old user')
    const { error: clearError } = await adminClient
      .from('users')
      .update({ 
        email: `deleted_${oldId}@temp.local`,
        rut: null 
      })
      .eq('id', oldId)

    if (clearError) {
      console.error('[COMPLETE_PROFILE] Error clearing old user fields:', clearError)
      return { success: false, error: 'server' }
    }

    // PASO 2: Crear el nuevo registro de usuario con todos los datos
    console.log('[COMPLETE_PROFILE] Step 2: Creating new user record')
    const { error: insertError } = await adminClient
      .from('users')
      .insert({
        id: newId,
        email: user.email,
        full_name: fullNameInput,
        rut,
        role: oldUserData?.role || 'customer',
        points_balance: oldUserData?.points_balance || 0,
        shipping_fee_exempt: oldUserData?.shipping_fee_exempt || false,
        address: oldUserData?.address,
        address_number: oldUserData?.address_number,
        address_extra: oldUserData?.address_extra,
        comuna: oldUserData?.comuna,
        region: oldUserData?.region,
        deleted_at: null
      })

    if (insertError) {
      console.error('[COMPLETE_PROFILE] Error inserting new user:', insertError)
      return { success: false, error: 'server' }
    }

    // PASO 2: Migrar todas las foreign keys al nuevo ID
    console.log('[COMPLETE_PROFILE] Step 2: Migrating foreign keys')
    const tablesToUpdate = [
      { table: 'orders', column: 'user_id' },
      { table: 'loyalty_points', column: 'user_id' },
      { table: 'b2b_clients', column: 'user_id' },
      { table: 'discount_code_usage', column: 'user_id' },
      { table: 'discount_codes', column: 'user_id' },
      { table: 'prospects', column: 'user_id' },
      { table: 'prospect_interactions', column: 'created_by' },
      { table: 'product_movements', column: 'customer_user_id' },
      { table: 'product_movements', column: 'created_by' },
      { table: 'movement_payments', column: 'created_by' },
      { table: 'stock_entries', column: 'created_by' },
      { table: 'stock_entry_history', column: 'changed_by' },
      { table: 'purchase_orders', column: 'created_by' },
    ]

    for (const { table, column } of tablesToUpdate) {
      const { error, count } = await adminClient
        .from(table)
        .update({ [column]: newId })
        .eq(column, oldId)
      
      if (error) {
        console.log(`[COMPLETE_PROFILE] ${table}.${column}: error -`, error.message)
      } else {
        console.log(`[COMPLETE_PROFILE] ${table}.${column}: migrated`)
      }
    }

    // PASO 4: Eliminar el registro antiguo (ya no tiene referencias ni unique constraints)
    console.log('[COMPLETE_PROFILE] Step 4: Deleting old user record')
    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', oldId)

    if (deleteError) {
      console.error('[COMPLETE_PROFILE] Error deleting old user:', deleteError)
      // No es crítico, el usuario antiguo quedará como "fantasma" pero no afecta la operación
    }

    console.log('[COMPLETE_PROFILE] Migration complete')
  } else if (existingByEmail && existingByEmail.id === user.id) {
    // USUARIO EXISTENTE: Mismo ID, solo actualizar datos
    console.log('[COMPLETE_PROFILE] Updating existing user record')
    
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        full_name: fullNameInput,
        rut,
        deleted_at: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[COMPLETE_PROFILE] Error updating user:', updateError)
      return { success: false, error: 'server' }
    }
  } else {
    // NUEVO USUARIO: No existe, crear registro
    console.log('[COMPLETE_PROFILE] Creating new user record')
    
    const { error: insertError } = await adminClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullNameInput,
        rut,
        role: 'customer',
        deleted_at: null
      })

    if (insertError) {
      console.error('[COMPLETE_PROFILE] Error inserting user:', insertError)
      return { success: false, error: 'server' }
    }
  }

  console.log('[COMPLETE_PROFILE] User created/updated in database')

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: fullNameInput,
      rut
    }
  })

  if (metadataError) {
    console.error('[COMPLETE_PROFILE] Error updating metadata:', metadataError)
    return { success: false, error: 'server' }
  }

  console.log('[COMPLETE_PROFILE] Profile updated successfully')
  return { success: true, full_name: fullNameInput, rut }
}
