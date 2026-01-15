
'use server'

import { createClient } from '@/lib/supabase/server'
import { B2BService, B2BApplicationData } from '@calmar/database'
import { revalidatePath } from 'next/cache'
import { sendB2BApplicationAdminNotification, sendB2BApplicationReceivedEmail } from '@/lib/mail'
import { normalizeRut, isValidRut } from '@calmar/utils'

export async function submitB2BApplication(data: B2BApplicationData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para postular como B2B')
  }

  const b2bService = new B2BService(supabase)
  const taxId = normalizeRut(data.tax_id)

  if (!taxId || !isValidRut(taxId)) {
    return { success: false, error: 'El RUT no es válido' }
  }
  
  try {
    await b2bService.applyForB2B(user.id, { ...data, tax_id: taxId })

    await sendB2BApplicationAdminNotification({
      companyName: data.company_name,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      taxId,
    })

    await sendB2BApplicationReceivedEmail({
      contactName: data.contact_name,
      companyName: data.company_name,
      contactEmail: data.contact_email,
    })
    revalidatePath('/account')
    return { success: true }
  } catch (error: any) {
    console.error('B2B Application Error:', error)
    return { success: false, error: error.message }
  }
}
