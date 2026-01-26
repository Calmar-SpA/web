'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeRut, isValidRut } from '@calmar/utils'

export type ActionState = {
  success: boolean
  error?: string | null
  values?: Record<string, string>
}

export async function login(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const locale = String(formData.get('locale') || '').trim()
  const accountPath = locale ? `/${locale}/account` : '/account'

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const values = { email }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message = error.message.toLowerCase()
    const code = error.code?.toLowerCase() || ''

    let errorType = 'generic'
    if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) {
      errorType = 'invalid_credentials'
    } else if (message.includes('email not confirmed')) {
      errorType = 'email_not_confirmed'
    }

    return { success: false, error: errorType, values }
  }

  revalidatePath('/', 'layout')
  redirect(accountPath)
}

export async function loginWithGoogle(locale: string) {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackPath = locale ? `/${locale}/auth/callback` : '/auth/callback'
  const accountPath = locale ? `/${locale}/account` : '/account'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}${callbackPath}?next=${encodeURIComponent(accountPath)}`
    }
  })

  if (error || !data.url) {
    const loginPath = locale ? `/${locale}/login` : '/login'
    redirect(`${loginPath}?login_error=google_failed`)
  }

  redirect(data.url)
}

export async function signup(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  console.log('[SIGNUP DEBUG] Iniciando proceso de registro')
  const supabase = await createClient()
  const locale = String(formData.get('locale') || '').trim()
  const loginPath = locale ? `/${locale}/login` : '/login'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackPath = locale ? `/${locale}/auth/callback` : '/auth/callback'
  const accountPath = locale ? `/${locale}/account` : '/account'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullNameInput = String(formData.get('full_name') || '').trim()
  const rutInput = String(formData.get('rut') || '')

  const values = { email, full_name: fullNameInput, rut: rutInput }

  const fullNameParts = fullNameInput.split(/\s+/).filter(Boolean)

  if (fullNameParts.length < 2) {
    console.log('[SIGNUP DEBUG] Error: Nombre incompleto')
    return { success: false, error: 'full_name', values }
  }

  const rut = normalizeRut(rutInput)
  console.log('[SIGNUP DEBUG] RUT procesado:', { original: rutInput, normalized: rut })

  if (!rut || !isValidRut(rut)) {
    console.log('[SIGNUP DEBUG] Error: RUT inválido')
    return { success: false, error: 'rut', values }
  }

  console.log('[SIGNUP DEBUG] Llamando a supabase.auth.signUp...')
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        rut,
        full_name: fullNameInput
      },
      emailRedirectTo: `${baseUrl}${callbackPath}?next=${encodeURIComponent(accountPath)}`
    }
  })

  if (error) {
    console.error('[SIGNUP ERROR REAL]', error)
    const message = error.message.toLowerCase()
    const code = error.code?.toLowerCase() || ''

    let errorType = 'generic'
    if (code.includes('user_already_exists') || message.includes('already registered') || message.includes('already exists')) {
      errorType = 'email_exists'
    } else if (code.includes('weak_password') || (message.includes('password') && (message.includes('weak') || message.includes('short')))) {
      errorType = 'weak_password'
    } else if (code.includes('email_address_invalid') || (message.includes('email') && message.includes('invalid'))) {
      errorType = 'email_invalid'
    } else if (message.includes('idx_users_rut_unique') || message.includes('users_rut_key') || (message.includes('rut') && message.includes('unique'))) {
      errorType = 'rut_exists'
    }

    return { success: false, error: errorType, values }
  }

  revalidatePath('/', 'layout')
  redirect(`${loginPath}?tab=register&signup_success=true`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
