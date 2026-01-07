
'use server'

import { createClient } from '@/lib/supabase/server'
import { B2BService } from '@calmar/database'
import { revalidatePath } from 'next/cache'

export async function createB2BApiKey(clientId: string, name: string) {
  const supabase = await createClient()
  const b2bService = new B2BService(supabase)
  
  try {
    const fullKey = await b2bService.createApiKey(clientId, name)
    revalidatePath('/account')
    return { success: true, key: fullKey }
  } catch (error: any) {
    console.error('API Key Error:', error)
    return { success: false, error: error.message }
  }
}
