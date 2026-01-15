'use server'

import { createClient } from '@/lib/supabase/server'
import { CRMService } from '@calmar/database'
import { revalidatePath } from 'next/cache'

export async function createProspect(data: {
  type: 'b2b' | 'b2c'
  company_name?: string
  contact_name: string
  email: string
  phone?: string
  tax_id?: string
  notes?: string
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const prospect = await crmService.createProspect(data)
  
  revalidatePath('/crm/prospects')
  revalidatePath('/crm')
  
  return prospect
}

export async function updateProspectStage(prospectId: string, stage: string) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  await crmService.updateProspectStage(prospectId, stage)
  
  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
}

export async function createInteraction(data: {
  prospect_id: string
  interaction_type: 'call' | 'email' | 'meeting' | 'note' | 'sample_sent' | 'quote_sent' | 'other'
  subject?: string
  notes: string
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const interaction = await crmService.createInteraction(data)
  
  revalidatePath(`/crm/prospects/${data.prospect_id}`)
  
  return interaction
}

export async function createMovement(data: {
  movement_type: 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit'
  prospect_id?: string | null
  b2b_client_id?: string | null
  customer_user_id?: string | null
  items: Array<{
    product_id: string
    variant_id?: string | null
    quantity: number
    unit_price: number
  }>
  total_amount: number
  due_date?: string | null
  delivery_date?: string | null
  notes?: string
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const movement = await crmService.createMovement(data)
  
  revalidatePath('/crm/movements')
  revalidatePath('/crm/debts')
  if (data.prospect_id) {
    revalidatePath(`/crm/prospects/${data.prospect_id}`)
  }
  
  return movement
}

export async function updateMovementStatus(
  movementId: string,
  status: string,
  deliveryDate?: string
) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  await crmService.updateMovementStatus(movementId, status, deliveryDate)
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${movementId}`)
  revalidatePath('/crm/debts')
}

export async function registerPayment(data: {
  movement_id: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'check' | 'credit_card' | 'other'
  payment_reference?: string
  notes?: string
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const payment = await crmService.registerPayment(data)
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${data.movement_id}`)
  revalidatePath('/crm/debts')
  
  return payment
}

export async function returnConsignment(
  movementId: string,
  returnedItems: Array<{
    product_id: string
    variant_id?: string | null
    quantity: number
    unit_price: number
  }>
) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const movement = await crmService.returnConsignment(movementId, returnedItems)
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${movementId}`)
  
  return movement
}

export async function convertConsignmentToSale(movementId: string) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const movement = await crmService.convertConsignmentToSale(movementId)
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${movementId}`)
  revalidatePath('/crm/debts')
  
  return movement
}
