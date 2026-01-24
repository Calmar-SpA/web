'use server'

import { createClient } from '@/lib/supabase/server'
import { CRMService } from '@calmar/database'
import { sendProspectActivationEmail, sendProspectAdminNotification, sendRefundAdminNotification, sendPaymentStatusCustomerNotification } from '@/lib/mail'
import { revalidatePath } from 'next/cache'
import { formatPhoneIntl, formatRut, isValidPhoneIntl, isValidRut, normalizeRut, parsePhoneIntl } from '@calmar/utils'

type FixedPriceInput = { productId: string; fixedPrice: number }

export async function createProspect(data: {
  type: 'b2b' | 'b2c'
  company_name?: string
  contact_name: string
  contact_role?: string
  email: string
  phone?: string
  phone_country?: string
  tax_id?: string
  address?: string
  city?: string
  comuna?: string
  business_activity?: string
  requesting_rut?: string
  shipping_address?: string
  notes?: string
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  const taxId = normalizeRut(data.tax_id)
  const requestingRut = normalizeRut(data.requesting_rut)
  const phoneCountry = data.phone_country || '56'
  const phoneFormatted = data.phone ? formatPhoneIntl(phoneCountry, data.phone) : undefined
  const { phone_country: _phoneCountry, ...prospectData } = data

  if (!taxId || !isValidRut(taxId)) {
    throw new Error('El RUT no es válido')
  }
  if (data.requesting_rut && (!requestingRut || !isValidRut(requestingRut))) {
    throw new Error('El RUT solicita no es válido')
  }
  if (data.phone && !isValidPhoneIntl(data.phone)) {
    throw new Error('El teléfono no es válido')
  }

  const formattedTaxId = formatRut(taxId)
  const { data: existingProspect } = await supabase
    .from('prospects')
    .select('id')
    .in('tax_id', [taxId, formattedTaxId])
    .maybeSingle()

  if (existingProspect) {
    throw new Error('Ya existe un prospecto con ese RUT')
  }
  
  const prospect = await crmService.createProspect({
    ...prospectData,
    tax_id: formattedTaxId,
    requesting_rut: requestingRut ? formatRut(requestingRut) : undefined,
    phone: phoneFormatted
  })

  await sendProspectAdminNotification({
    contactName: data.contact_name,
    email: data.email,
    phone: phoneFormatted,
    type: data.type,
    companyName: data.company_name,
    taxId: formattedTaxId,
    contactRole: data.contact_role,
    notes: data.notes,
  })
  
  revalidatePath('/crm/prospects')
  revalidatePath('/crm')
  
  return prospect
}

export async function approveProspectAsB2B(
  prospectId: string,
  data: { creditLimit: number; paymentTermsDays?: number },
  fixedPrices: FixedPriceInput[]
) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)

  const prospect = await crmService.approveProspectAsB2B(prospectId, data)
  await crmService.syncProspectProductPrices(prospectId, fixedPrices)

  if (prospect?.user_id) {
    await supabase
      .from('users')
      .update({ role: 'b2b' })
      .eq('id', prospect.user_id)
  }

  const { data: userByEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', prospect.email)
    .maybeSingle()

  const hasAccount = Boolean(prospect.user_id || userByEmail)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const registerUrl = new URL('/register', baseUrl)
  const accountUrl = new URL('/account', baseUrl)
  registerUrl.searchParams.set('type', prospect.type || '')
  registerUrl.searchParams.set('company_name', prospect.company_name || '')
  registerUrl.searchParams.set('contact_name', prospect.contact_name || '')
  registerUrl.searchParams.set('contact_role', prospect.contact_role || '')
  registerUrl.searchParams.set('email', prospect.email || '')
  registerUrl.searchParams.set('phone', prospect.phone || '')
  registerUrl.searchParams.set('tax_id', prospect.tax_id || '')
  registerUrl.searchParams.set('address', prospect.address || '')
  registerUrl.searchParams.set('city', prospect.city || '')
  registerUrl.searchParams.set('comuna', prospect.comuna || '')
  registerUrl.searchParams.set('business_activity', prospect.business_activity || '')
  registerUrl.searchParams.set('requesting_rut', prospect.requesting_rut || '')
  registerUrl.searchParams.set('shipping_address', prospect.shipping_address || '')
  registerUrl.searchParams.set('notes', prospect.notes || '')

  await sendProspectActivationEmail({
    contactName: prospect.contact_name,
    contactEmail: prospect.email,
    hasAccount,
    registerUrl: registerUrl.toString(),
    accountUrl: accountUrl.toString()
  })

  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
  return { success: true }
}

export async function updateProspectB2BSettings(
  prospectId: string,
  data: { creditLimit: number; paymentTermsDays?: number },
  fixedPrices: FixedPriceInput[]
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('prospects')
    .update({
      credit_limit: data.creditLimit,
      payment_terms_days: data.paymentTermsDays || 30,
      updated_at: new Date().toISOString()
    })
    .eq('id', prospectId)

  if (error) throw error

  const crmService = new CRMService(supabase)
  await crmService.syncProspectProductPrices(prospectId, fixedPrices)

  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
  return { success: true }
}

export async function toggleProspectB2BActive(prospectId: string, currentIsActive: boolean) {
  const supabase = await createClient()

  const { data: prospect, error } = await supabase
    .from('prospects')
    .update({
      is_b2b_active: !currentIsActive,
      b2b_approved_at: !currentIsActive ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', prospectId)
    .select('user_id')
    .single()

  if (error) throw error

  if (prospect?.user_id) {
    await supabase
      .from('users')
      .update({ role: !currentIsActive ? 'b2b' : 'customer' })
      .eq('id', prospect.user_id)
  }

  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
  return { success: true }
}

export async function updateProspectStage(prospectId: string, stage: string) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  await crmService.updateProspectStage(prospectId, stage)
  
  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
}

const REQUIRED_PROSPECT_FIELDS = [
  { key: 'type', label: 'Tipo' },
  { key: 'company_name', label: 'Razón Social' },
  { key: 'contact_name', label: 'Nombre de Contacto' },
  { key: 'contact_role', label: 'Cargo del Contacto' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'tax_id', label: 'RUT' },
  { key: 'address', label: 'Dirección empresa' },
  { key: 'city', label: 'Ciudad' },
  { key: 'comuna', label: 'Comuna' },
  { key: 'business_activity', label: 'Giro' },
  { key: 'requesting_rut', label: 'RUT solicita' },
  { key: 'shipping_address', label: 'Dirección de despacho' },
  { key: 'notes', label: 'Notas' }
]

const isBlank = (value?: string | null) => !value || !String(value).trim()

const getMissingActivationFields = (prospect: any) => {
  const parsedPhone = parsePhoneIntl(prospect?.phone || '')
  const phoneDigits = parsedPhone.digits || ''

  return REQUIRED_PROSPECT_FIELDS.filter(({ key }) => {
    if (key === 'phone') {
      return isBlank(phoneDigits) || !isValidPhoneIntl(phoneDigits)
    }
    if (key === 'tax_id') {
      return isBlank(prospect?.tax_id) || !isValidRut(String(prospect.tax_id))
    }
    if (key === 'requesting_rut') {
      return isBlank(prospect?.requesting_rut) || !isValidRut(String(prospect.requesting_rut))
    }
    if (key === 'type') {
      return prospect?.type !== 'b2b' && prospect?.type !== 'b2c'
    }
    return isBlank(prospect?.[key])
  })
}

export async function activateProspect(prospectId: string) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)

  const { data: prospect, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  if (error) throw error

  const missingFields = getMissingActivationFields(prospect)
  if (missingFields.length > 0) {
    const missingLabels = missingFields.map(field => field.label).join(', ')
    throw new Error(`Faltan datos obligatorios: ${missingLabels}`)
  }

  const { data: userByEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', prospect.email)
    .maybeSingle()

  const hasAccount = Boolean(prospect.user_id || userByEmail)

  await crmService.updateProspectStage(prospectId, 'converted')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const registerUrl = new URL('/register', baseUrl)
  const accountUrl = new URL('/account', baseUrl)
  registerUrl.searchParams.set('type', prospect.type || '')
  registerUrl.searchParams.set('company_name', prospect.company_name || '')
  registerUrl.searchParams.set('contact_name', prospect.contact_name || '')
  registerUrl.searchParams.set('contact_role', prospect.contact_role || '')
  registerUrl.searchParams.set('email', prospect.email || '')
  registerUrl.searchParams.set('phone', prospect.phone || '')
  registerUrl.searchParams.set('tax_id', prospect.tax_id || '')
  registerUrl.searchParams.set('address', prospect.address || '')
  registerUrl.searchParams.set('city', prospect.city || '')
  registerUrl.searchParams.set('comuna', prospect.comuna || '')
  registerUrl.searchParams.set('business_activity', prospect.business_activity || '')
  registerUrl.searchParams.set('requesting_rut', prospect.requesting_rut || '')
  registerUrl.searchParams.set('shipping_address', prospect.shipping_address || '')
  registerUrl.searchParams.set('notes', prospect.notes || '')

  await sendProspectActivationEmail({
    contactName: prospect.contact_name,
    contactEmail: prospect.email,
    hasAccount,
    registerUrl: registerUrl.toString(),
    accountUrl: accountUrl.toString()
  })

  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
}

export async function updateProspect(prospectId: string, formData: FormData) {
  const supabase = await createClient()

  const taxIdRaw = (formData.get('tax_id') as string)?.trim()
  const taxId = taxIdRaw ? normalizeRut(taxIdRaw) : null
  const requestingRutRaw = (formData.get('requesting_rut') as string)?.trim()
  const requestingRut = requestingRutRaw ? normalizeRut(requestingRutRaw) : null
  const phoneCountry = (formData.get('phone_country') as string)?.trim() || '56'
  const phoneRaw = (formData.get('phone') as string)?.trim()
  const phoneFormatted = phoneRaw ? formatPhoneIntl(phoneCountry, phoneRaw) : null

  if (taxIdRaw && (!taxId || !isValidRut(taxId))) {
    throw new Error('El RUT no es válido')
  }
  if (requestingRutRaw && (!requestingRut || !isValidRut(requestingRut))) {
    throw new Error('El RUT solicita no es válido')
  }
  if (phoneRaw && !isValidPhoneIntl(phoneRaw)) {
    throw new Error('El teléfono no es válido')
  }

  if (taxId) {
    const formattedTaxId = formatRut(taxId)
    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id')
      .in('tax_id', [taxId, formattedTaxId])
      .neq('id', prospectId)
      .maybeSingle()

    if (existingProspect) {
      throw new Error('Ya existe un prospecto con ese RUT')
    }
  }

  const payload = {
    type: (formData.get('type') as string) || 'b2b',
    company_name: (formData.get('company_name') as string)?.trim() || null,
    contact_name: (formData.get('contact_name') as string)?.trim(),
    contact_role: (formData.get('contact_role') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim(),
    phone: phoneFormatted,
    tax_id: taxId ? formatRut(taxId) : null,
    address: (formData.get('address') as string)?.trim() || null,
    city: (formData.get('city') as string)?.trim() || null,
    comuna: (formData.get('comuna') as string)?.trim() || null,
    business_activity: (formData.get('business_activity') as string)?.trim() || null,
    requesting_rut: requestingRut ? formatRut(requestingRut) : null,
    shipping_address: (formData.get('shipping_address') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }

  if (!payload.contact_name || !payload.email) {
    throw new Error('Nombre de contacto y email son obligatorios')
  }

  const { error } = await supabase
    .from('prospects')
    .update(payload)
    .eq('id', prospectId)

  if (error) throw error

  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
}

export async function deleteProspect(prospectId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', prospectId)

  if (error) throw error

  revalidatePath('/crm/prospects')
  revalidatePath('/crm')
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
  sample_recipient_name?: string | null
  sample_event_context?: string | null
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

  await sendRefundAdminNotification({
    referenceId: movementId,
    reason: 'Devolucion de consignacion registrada en CRM',
  })
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${movementId}`)
  
  return movement
}

export async function approvePayment(paymentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: payment, error } = await supabase
    .from('movement_payments')
    .update({
      verification_status: 'approved',
      verified_by: user?.id,
      verified_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select('*, movement:product_movements(*, customer:users!customer_user_id(*), prospect:prospects(*))')
    .single()

  if (error) throw error
  
  // Notify customer
  const movement = payment.movement
  const customerEmail = movement?.customer?.email || movement?.prospect?.email
  const customerName = movement?.customer?.full_name || movement?.prospect?.contact_name || 'Cliente'
  
  if (customerEmail) {
    await sendPaymentStatusCustomerNotification({
      to: customerEmail,
      customerName,
      movementNumber: movement.movement_number || movement.id.slice(0, 8),
      amount: Number(payment.amount),
      status: 'approved'
    })
  }

  revalidatePath('/crm/payments')
  if (payment?.movement_id) {
    revalidatePath(`/crm/movements/${payment.movement_id}`)
  }
  return { success: true }
}

export async function rejectPayment(paymentId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: payment, error } = await supabase
    .from('movement_payments')
    .update({
      verification_status: 'rejected',
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', paymentId)
    .select('*, movement:product_movements(*, customer:users!customer_user_id(*), prospect:prospects(*))')
    .single()

  if (error) throw error
  
  // Notify customer
  const movement = payment.movement
  const customerEmail = movement?.customer?.email || movement?.prospect?.email
  const customerName = movement?.customer?.full_name || movement?.prospect?.contact_name || 'Cliente'
  
  if (customerEmail) {
    await sendPaymentStatusCustomerNotification({
      to: customerEmail,
      customerName,
      movementNumber: movement.movement_number || movement.id.slice(0, 8),
      amount: Number(payment.amount),
      status: 'rejected',
      rejectionReason: reason
    })
  }

  revalidatePath('/crm/payments')
  if (payment?.movement_id) {
    revalidatePath(`/crm/movements/${payment.movement_id}`)
  }
  return { success: true }
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
