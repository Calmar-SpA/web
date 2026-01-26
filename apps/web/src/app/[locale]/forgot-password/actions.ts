'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type ActionState = {
  success: boolean
  error?: string | null
}

export async function requestPasswordReset(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const locale = String(formData.get('locale') || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetPath = locale ? `/${locale}/reset-password` : '/reset-password'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}${resetPath}`
  })
  
  if (error) {
    console.error('[FORGOT PASSWORD ERROR]', error)
    return { success: false, error: 'generic' }
  }

  return { success: true }
}
