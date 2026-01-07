'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'invalid_email' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: true, message: 'already_subscribed' }
      }
      console.error('Newsletter Error Details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return { success: false, message: 'server_error' }
    }

    revalidatePath('/')
    return { success: true, message: 'subscribed' }
  } catch (error: any) {
    console.error('Newsletter Exception:', error)
    return { success: false, message: 'server_error', error: error?.message }
  }
}
