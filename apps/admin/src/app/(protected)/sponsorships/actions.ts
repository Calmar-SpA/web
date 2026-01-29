'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSponsorshipStatus(id: string, status: string) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('sponsorship_requests')
    .update({ status })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/sponsorships')
  revalidatePath(`/sponsorships/${id}`)
}

export async function updateSponsorshipNotes(id: string, admin_notes: string) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('sponsorship_requests')
    .update({ admin_notes })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/sponsorships')
  revalidatePath(`/sponsorships/${id}`)
}

export async function deleteSponsorshipRequest(id: string) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('sponsorship_requests')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/sponsorships')
}
