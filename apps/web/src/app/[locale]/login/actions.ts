'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeRut, isValidRut } from '@calmar/utils'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const locale = String(formData.get('locale') || '').trim()
  const loginPath = locale ? `/${locale}/login` : '/login'
  const accountPath = locale ? `/${locale}/account` : '/account'

  // type-casting here for convenience
  // in practice, you should use a validation library
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const message = error.message.toLowerCase()
    const code = error.code?.toLowerCase() || ''

    if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) {
      redirect(`${loginPath}?login_error=invalid_credentials`)
    }

    if (message.includes('email not confirmed')) {
      redirect(`${loginPath}?login_error=email_not_confirmed`)
    }

    redirect(`${loginPath}?login_error=generic`)
  }

  revalidatePath('/', 'layout')
  redirect(accountPath)
}

export async function signup(formData: FormData) {
  console.log('[SIGNUP DEBUG] Iniciando proceso de registro')
  const supabase = await createClient()
  const locale = String(formData.get('locale') || '').trim()
  const loginPath = locale ? `/${locale}/login` : '/login'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackPath = locale ? `/${locale}/auth/callback` : '/auth/callback'
  const accountPath = locale ? `/${locale}/account` : '/account'
  const buildSignupRedirect = (code: string) => {
    console.log(`[SIGNUP DEBUG] Redirigiendo con error: ${code}`)
    return redirect(`${loginPath}?tab=register&signup_error=${code}`)
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const fullNameInput = String(formData.get('full_name') || '').trim()
  console.log('[SIGNUP DEBUG] Datos recibidos:', { email: data.email, fullName: fullNameInput })

  const fullNameParts = fullNameInput.split(/\s+/).filter(Boolean)

  if (fullNameParts.length < 2) {
    console.log('[SIGNUP DEBUG] Error: Nombre incompleto')
    buildSignupRedirect('full_name')
  }

  const rutInput = String(formData.get('rut') || '')
  const rut = normalizeRut(rutInput)
  console.log('[SIGNUP DEBUG] RUT procesado:', { original: rutInput, normalized: rut })

  if (!rut || !isValidRut(rut)) {
    console.log('[SIGNUP DEBUG] Error: RUT inválido')
    buildSignupRedirect('rut')
  }

  console.log('[SIGNUP DEBUG] Llamando a supabase.auth.signUp...')
  const { data: signupData, error } = await supabase.auth.signUp({
    ...data,
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
    // ... resto del código de manejo de errores

    const message = error.message.toLowerCase()
    const code = error.code?.toLowerCase() || ''

    if (code.includes('user_already_exists') || message.includes('already registered') || message.includes('already exists')) {
      buildSignupRedirect('email_exists')
    }

    if (code.includes('weak_password') || (message.includes('password') && (message.includes('weak') || message.includes('short')))) {
      buildSignupRedirect('weak_password')
    }

    if (code.includes('email_address_invalid') || (message.includes('email') && message.includes('invalid'))) {
      buildSignupRedirect('email_invalid')
    }

    // Detectar error de RUT duplicado (violación de constraint único en la tabla users)
    if (message.includes('idx_users_rut_unique') || message.includes('users_rut_key') || message.includes('rut') && message.includes('unique')) {
      buildSignupRedirect('rut_exists')
    }

    buildSignupRedirect('generic')
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
