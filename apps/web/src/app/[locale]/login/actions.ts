'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeRut, isValidRut } from '@calmar/utils'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should use a validation library
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const locale = String(formData.get('locale') || '').trim()
  const loginPath = locale ? `/${locale}/login` : '/login'

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const fullNameInput = String(formData.get('full_name') || '').trim()
  const fullNameParts = fullNameInput.split(/\s+/).filter(Boolean)

  if (fullNameParts.length < 2) {
    redirect(`${loginPath}?signup_error=full_name`)
  }

  const rutInput = String(formData.get('rut') || '')
  const rut = normalizeRut(rutInput)

  if (!rut || !isValidRut(rut)) {
    redirect(`${loginPath}?signup_error=rut`)
  }

  const { error } = await supabase.auth.signUp({
    ...data,
    options: {
      data: {
        rut,
        full_name: fullNameInput
      }
    }
  })

  if (error) {
    redirect(`${loginPath}?signup_error=generic`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
