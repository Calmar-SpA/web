'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { normalizeRut, isValidRut } from '@calmar/utils'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=Sesión%20inválida`)
  }

  const fullName = String(formData.get('full_name') || '').trim()
  const rutInput = String(formData.get('rut') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const rut = normalizeRut(rutInput)

  if (!rut || !isValidRut(rut)) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=El%20RUT%20no%20es%20válido`)
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=El%20email%20no%20es%20válido`)
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('rut', rut)
    .neq('id', user.id)
    .single()

  if (existingUser) {
    throw new Error('Este RUT ya está asociado a otra cuenta')
  }

  if (email !== user.email) {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', user.id)
      .single()

    if (existingEmail) {
      const locale = String(formData.get('locale') || '').trim()
      const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
      redirect(`${settingsPath}?error=Este%20email%20ya%20está%20asociado%20a%20otra%20cuenta`)
    }

    const { error: emailError } = await supabase.auth.updateUser({ email })
    if (emailError) {
      const locale = String(formData.get('locale') || '').trim()
      const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
      redirect(`${settingsPath}?error=No%20se%20pudo%20actualizar%20el%20email`)
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
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=No%20se%20pudo%20actualizar%20el%20perfil`)
  }

  const locale = String(formData.get('locale') || '').trim()
  const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
  revalidatePath(settingsPath)
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=Sesión%20inválida`)
  }

  const newPassword = String(formData.get('new_password') || '').trim()
  const confirmPassword = String(formData.get('confirm_password') || '').trim()

  if (!newPassword || newPassword.length < 8) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=La%20contraseña%20debe%20tener%20al%20menos%208%20caracteres`)
  }

  if (newPassword !== confirmPassword) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=Las%20contraseñas%20no%20coinciden`)
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    const locale = String(formData.get('locale') || '').trim()
    const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
    redirect(`${settingsPath}?error=No%20se%20pudo%20actualizar%20la%20contraseña`)
  }

  const locale = String(formData.get('locale') || '').trim()
  const settingsPath = locale ? `/${locale}/account/settings` : '/account/settings'
  revalidatePath(settingsPath)
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
