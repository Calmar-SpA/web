'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface BankAccountData {
  bank_name: string
  account_type: string
  account_number: string
  account_holder: string
  rut: string
  email: string
}

export async function updateBankSettings(bankData: BankAccountData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase
    .from('system_settings')
    .update({
      setting_value: bankData,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', 'bank_account_for_transfers')

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}
