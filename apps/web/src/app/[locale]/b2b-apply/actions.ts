
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendB2BApplicationAdminNotification, sendB2BApplicationReceivedEmail } from '@/lib/mail'
import { normalizeRut, isValidRut, formatRut } from '@calmar/utils'

interface B2BApplicationData {
  company_name: string
  tax_id: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

export async function submitB2BApplication(data: B2BApplicationData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para postular como B2B')
  }

  const taxId = normalizeRut(data.tax_id)

  if (!taxId || !isValidRut(taxId)) {
    return { success: false, error: 'El RUT no es válido' }
  }
  
  try {
    const formattedTaxId = formatRut(taxId)
    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id')
      .in('tax_id', [taxId, formattedTaxId])
      .maybeSingle()

    if (existingProspect) {
      return { success: false, error: 'Ya existe un prospecto con ese RUT' }
    }

    const { error: insertError } = await supabase
      .from('prospects')
      .insert({
        type: 'b2b',
        stage: 'interested',
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.contact_email,
        phone: data.contact_phone,
        tax_id: formattedTaxId,
        user_id: user.id,
        notes: 'Postulación B2B desde web'
      })

    if (insertError) throw insertError

    await sendB2BApplicationAdminNotification({
      companyName: data.company_name,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      taxId: formattedTaxId,
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
