'use server'

import { createClient } from '@/lib/supabase/server'
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

  if (!user) {
    return { success: false, error: 'session' }
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

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('rut', rut)
    .neq('id', user.id)
    .single()

  if (existingUser) {
    return { success: false, error: 'rut_exists' }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      full_name: fullNameInput,
      rut
    })
    .eq('id', user.id)

  if (updateError) {
    return { success: false, error: 'server' }
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: fullNameInput,
      rut
    }
  })

  if (metadataError) {
    return { success: false, error: 'server' }
  }

  return { success: true, full_name: fullNameInput, rut }
}
