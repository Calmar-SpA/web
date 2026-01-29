'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendSponsorshipAdminNotification, sendSponsorshipReceivedEmail } from '@/lib/mail'

interface SponsorshipApplicationData {
  applicant_type: string
  name: string
  contact_name: string
  email: string
  phone?: string
  social_instagram?: string
  social_tiktok?: string
  social_youtube?: string
  social_other?: string
  audience_size?: string
  proposal: string
  sponsorship_type: string
  budget_requested?: number
}

export async function submitSponsorshipApplication(data: SponsorshipApplicationData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Validate required fields
  if (!data.name || !data.contact_name || !data.email || !data.proposal) {
    return { success: false, error: 'Faltan campos requeridos' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return { success: false, error: 'El email no es válido' }
  }

  // Validate applicant type
  const validApplicantTypes = ['evento', 'deportista', 'organizacion', 'influencer', 'otro']
  if (!validApplicantTypes.includes(data.applicant_type)) {
    return { success: false, error: 'Tipo de solicitante no válido' }
  }

  // Validate sponsorship type
  const validSponsorshipTypes = ['canje', 'monetario', 'mixto', 'otro']
  if (!validSponsorshipTypes.includes(data.sponsorship_type)) {
    return { success: false, error: 'Tipo de auspicio no válido' }
  }

  try {
    // Insert into database
    const { error: insertError } = await supabase
      .from('sponsorship_requests')
      .insert({
        applicant_type: data.applicant_type,
        name: data.name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone || null,
        social_instagram: data.social_instagram || null,
        social_tiktok: data.social_tiktok || null,
        social_youtube: data.social_youtube || null,
        social_other: data.social_other || null,
        audience_size: data.audience_size || null,
        proposal: data.proposal,
        sponsorship_type: data.sponsorship_type,
        budget_requested: data.budget_requested || null,
        status: 'pending',
      })

    if (insertError) throw insertError

    // Send notification emails
    await sendSponsorshipAdminNotification({
      applicantType: data.applicant_type,
      name: data.name,
      contactName: data.contact_name,
      email: data.email,
      phone: data.phone,
      socialInstagram: data.social_instagram,
      socialTiktok: data.social_tiktok,
      socialYoutube: data.social_youtube,
      socialOther: data.social_other,
      audienceSize: data.audience_size,
      proposal: data.proposal,
      sponsorshipType: data.sponsorship_type,
      budgetRequested: data.budget_requested,
    })

    await sendSponsorshipReceivedEmail({
      contactName: data.contact_name,
      name: data.name,
      contactEmail: data.email,
    })

    revalidatePath('/sponsorship')
    return { success: true }
  } catch (error: any) {
    console.error('Sponsorship Application Error:', error)
    return { success: false, error: error.message || 'Error al enviar la solicitud' }
  }
}
