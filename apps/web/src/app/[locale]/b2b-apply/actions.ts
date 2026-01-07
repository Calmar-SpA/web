
'use server'

import { createClient } from '@/lib/supabase/server'
import { B2BService, B2BApplicationData } from '@calmar/database'
import { revalidatePath } from 'next/cache'

export async function submitB2BApplication(data: B2BApplicationData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para postular como B2B')
  }

  const b2bService = new B2BService(supabase)
  
  try {
    await b2bService.applyForB2B(user.id, data)
    revalidatePath('/account')
    return { success: true }
  } catch (error: any) {
    console.error('B2B Application Error:', error)
    return { success: false, error: error.message }
  }
}
