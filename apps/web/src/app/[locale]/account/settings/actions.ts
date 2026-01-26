'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { normalizeRut, isValidRut } from '@calmar/utils'

export type ActionState = {
  success: boolean
  error?: string | null
  message?: string | null
  values?: Record<string, string>
}

function getRedirectPath(formData: FormData, defaultPath: string = 'account/settings'): string {
  const locale = String(formData.get('locale') || '').trim()
  const redirectTo = String(formData.get('redirect_to') || defaultPath).trim()
  return locale ? `/${locale}/${redirectTo}` : `/${redirectTo}`
}

export async function updateProfile(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const redirectPath = getRedirectPath(formData, 'account')

  const fullName = String(formData.get('full_name') || '').trim()
  const rutInput = String(formData.get('rut') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const rut = normalizeRut(rutInput)

  const values = { full_name: fullName, rut: rutInput, email }

  if (!user) {
    return { success: false, error: 'Sesión inválida', values }
  }

  if (!rut || !isValidRut(rut)) {
    return { success: false, error: 'El RUT no es válido', values }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'El email no es válido', values }
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('rut', rut)
    .neq('id', user.id)
    .maybeSingle()

  if (existingUser) {
    return { success: false, error: 'Este RUT ya está asociado a otra cuenta', values }
  }

  if (email !== user.email) {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', user.id)
      .maybeSingle()

    if (existingEmail) {
      return { success: false, error: 'Este email ya está asociado a otra cuenta', values }
    }

    const { error: emailError } = await supabase.auth.updateUser({ email })
    if (emailError) {
      return { success: false, error: 'No se pudo actualizar el email', values }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName || null,
      rut,
      email
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'No se pudo actualizar el perfil', values }
  }

  revalidatePath(redirectPath)
  revalidatePath(getRedirectPath(formData, 'account/settings'))
  return { success: true, message: 'Perfil actualizado con éxito', values }
}

export async function updatePassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const newPassword = String(formData.get('new_password') || '').trim()
  const confirmPassword = String(formData.get('confirm_password') || '').trim()

  if (!user) {
    return { success: false, error: 'Sesión inválida' }
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Las contraseñas no coinciden' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    return { success: false, error: 'No se pudo actualizar la contraseña' }
  }

  const locale = String(formData.get('locale') || '').trim()
  const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
  revalidatePath(settingsPath)
  return { success: true, message: 'Contraseña actualizada con éxito' }
}

export async function updateNewsletterPreference(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=Sesión%20inválida`)
  }

  const wantsActive = formData.get('newsletter_active') === 'on'

  if (wantsActive) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: user.email, is_active: true }, { onConflict: 'email' })
    if (error) {
      const locale = String(formData.get('locale') || '').trim()
      const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
      redirect(`${settingsPath}?error=No%20se%20pudo%20activar%20el%20newsletter`)
    }
  } else {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: false })
      .eq('email', user.email)
    if (error) {
      const locale = String(formData.get('locale') || '').trim()
      const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
      redirect(`${settingsPath}?error=No%20se%20pudo%20desactivar%20el%20newsletter`)
    }
  }

  const locale = String(formData.get('locale') || '').trim()
  const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
  revalidatePath(settingsPath)
}
