'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success: boolean
  error?: string | null
}

export async function resetPassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  const locale = String(formData.get('locale') || '').trim()
  const loginPath = locale ? `/${locale}/login` : '/login'

  if (password.length < 8) {
    return { success: false, error: 'too_short' }
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'mismatch' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  
  if (error) {
    console.error('[RESET PASSWORD ERROR]', error)
    return { success: false, error: 'generic' }
  }

  revalidatePath('/', 'layout')
  redirect(`${loginPath}?reset_success=true`)
}
