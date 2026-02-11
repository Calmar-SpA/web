'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CRMService } from '@calmar/database'
import { sendProspectActivationEmail, sendProspectAdminNotification, sendRefundAdminNotification, sendPaymentStatusCustomerNotification } from '@/lib/mail'
import { revalidatePath } from 'next/cache'
import { formatPhoneIntl, formatRut, isValidPhoneIntl, isValidRut, normalizeRut, parsePhoneIntl } from '@calmar/utils'

type FixedPriceInput = { productId: string; fixedPrice: number }

export async function checkDuplicateProspects(data: {
  contact_name?: string
  company_name?: string
  tax_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('prospects')
    .select('id, contact_name, company_name, tax_id, fantasy_name, type, stage')

  const conditions: string[] = []

  if (data.contact_name?.trim()) {
    conditions.push(`contact_name.ilike.%${data.contact_name.trim()}%`)
  }
  
  if (data.company_name?.trim()) {
    conditions.push(`company_name.ilike.%${data.company_name.trim()}%`)
  }

  if (data.tax_id) {
    const normalizedRut = normalizeRut(data.tax_id)
    if (normalizedRut) {
      const formattedRut = formatRut(normalizedRut)
      // Exact match for RUT
      conditions.push(`tax_id.eq.${normalizedRut}`)
      conditions.push(`tax_id.eq.${formattedRut}`)
    }
  }

  if (conditions.length === 0) {
    return []
  }

  const orCondition = conditions.join(',')
  
  if (orCondition) {
    query = query.or(orCondition)
  }

  const { data: prospects, error } = await query.limit(5)

  if (error) {
    console.error('Error checking duplicates:', error)
    return []
  }

  return prospects
}

export async function createProspect(data: {
  type: 'b2b' | 'b2c'
  company_name?: string
  fantasy_name?: string
  contact_name?: string
  contact_role?: string
  email?: string
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
  user_id?: string
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  const taxId = data.tax_id ? normalizeRut(data.tax_id) : null
  const requestingRut = normalizeRut(data.requesting_rut)
  const phoneCountry = data.phone_country || '56'
  const phoneFormatted = data.phone ? formatPhoneIntl(phoneCountry, data.phone) : undefined
  const { phone_country: _phoneCountry, user_id: manualUserId, ...prospectData } = data

  // Para B2C, validamos todos los campos obligatorios
  if (data.type === 'b2c') {
    if (!data.contact_name?.trim()) {
      throw new Error('El nombre de contacto es obligatorio')
    }
    if (!data.email?.trim()) {
      throw new Error('El email es obligatorio')
    }
    if (!taxId || !isValidRut(taxId)) {
      throw new Error('El RUT no es válido')
    }
  }

  // Para B2B, solo validamos si se proporcionan los datos
  if (taxId && !isValidRut(taxId)) {
    throw new Error('El RUT no es válido')
  }
  if (data.requesting_rut && (!requestingRut || !isValidRut(requestingRut))) {
    throw new Error('El RUT solicita no es válido')
  }
  if (data.phone && !isValidPhoneIntl(data.phone)) {
    throw new Error('El teléfono no es válido')
  }

  // Solo verificamos duplicados si se proporciona RUT
  let formattedTaxId: string | undefined = undefined
  if (taxId) {
    formattedTaxId = formatRut(taxId)
    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id')
      .in('tax_id', [taxId, formattedTaxId])
      .maybeSingle()

    if (existingProspect) {
      throw new Error('Ya existe un prospecto con ese RUT')
    }
  }
  
  const prospect = await crmService.createProspect({
    ...prospectData,
    tax_id: formattedTaxId,
    requesting_rut: requestingRut ? formatRut(requestingRut) : undefined,
    phone: phoneFormatted,
    user_id: manualUserId
  })

  // Si no se pasó un user_id manual y hay email, intentar vincular con usuario existente
  if (!manualUserId && data.email) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .maybeSingle()

    if (existingUser) {
      await supabase
        .from('prospects')
        .update({ user_id: existingUser.id })
        .eq('id', prospect.id)
    }
  }

  await sendProspectAdminNotification({
    contactName: data.contact_name,
    email: data.email,
    phone: phoneFormatted,
    type: data.type,
    companyName: data.company_name,
    fantasyName: data.fantasy_name,
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


export async function updateProspectStage(prospectId: string, stage: string) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  // Si se mueve a una etapa distinta de Activo, desactivar B2B
  if (stage !== 'converted') {
    await supabase
      .from('prospects')
      .update({ is_b2b_active: false })
      .eq('id', prospectId)
      .eq('type', 'b2b')
  }

  await crmService.updateProspectStage(prospectId, stage)
  
  revalidatePath('/crm/prospects')
  revalidatePath(`/crm/prospects/${prospectId}`)
}

const REQUIRED_PROSPECT_FIELDS = [
  { key: 'type', label: 'Tipo' },
  { key: 'company_name', label: 'Razón Social' },
  { key: 'fantasy_name', label: 'Nombre de Fantasía' },
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

  let userId = prospect.user_id

  // Si no tiene usuario vinculado, buscar por email
  if (!userId) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', prospect.email)
      .maybeSingle()

    if (userByEmail) {
      userId = userByEmail.id
      await supabase
        .from('prospects')
        .update({ user_id: userId })
        .eq('id', prospectId)
    }
  }

  const hasAccount = Boolean(userId)

  await crmService.updateProspectStage(prospectId, 'converted')

  // Si es B2B, activar flag is_b2b_active
  if (prospect.type === 'b2b') {
    await supabase
      .from('prospects')
      .update({ 
        is_b2b_active: true,
        b2b_approved_at: new Date().toISOString()
      })
      .eq('id', prospectId)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const registerUrl = new URL('/es/register', baseUrl)
  const accountUrl = new URL('/es/account', baseUrl)
  // ... (mantener el resto de los parámetros de la URL)
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

  // Enviar correo de activación siempre
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

export async function resendActivationEmail(prospectId: string) {
  const supabase = await createClient()

  const { data: prospect, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  if (error) throw error

  const { data: userByEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', prospect.email)
    .maybeSingle()

  const hasAccount = Boolean(prospect.user_id || userByEmail)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const registerUrl = new URL('/es/register', baseUrl)
  const accountUrl = new URL('/es/account', baseUrl)
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

  return { success: true }
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
    fantasy_name: (formData.get('fantasy_name') as string)?.trim() || null,
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
    credit_limit: formData.get('credit_limit') ? Number(formData.get('credit_limit')) : undefined,
    payment_terms_days: formData.get('payment_terms_days') ? Number(formData.get('payment_terms_days')) : undefined,
    notes: (formData.get('notes') as string)?.trim() || null,
    user_id: (formData.get('user_id') as string) || null,
  }

  // Para B2C, nombre de contacto y email son obligatorios
  if (payload.type === 'b2c' && (!payload.contact_name || !payload.email)) {
    throw new Error('Nombre de contacto y email son obligatorios para B2C')
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

export async function searchUsers(query: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(10)

  if (error) throw error
  return data
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
  movement_type: 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit' | 'sale_boleta'
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
  boleta_buyer_name?: string | null
}) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  // Force 0 price for samples
  if (data.movement_type === 'sample') {
    data.total_amount = 0
    data.items = data.items.map(item => ({ ...item, unit_price: 0 }))
  }

  // Validate credit for consignments
  if (data.movement_type === 'consignment' && data.prospect_id) {
    const { data: prospect } = await supabase
      .from('prospects')
      .select('credit_limit')
      .eq('id', data.prospect_id)
      .single()
      
    const creditLimit = Number(prospect?.credit_limit || 0)
    
    if (creditLimit < data.total_amount) {
      throw new Error(`Crédito insuficiente. Disponible: $${creditLimit.toLocaleString('es-CL')}, Requerido: $${data.total_amount.toLocaleString('es-CL')}`)
    }
  }
  
  const movement = await crmService.createMovement(data)
  
  revalidatePath('/crm/movements')
  revalidatePath('/crm/debts')
  revalidatePath('/products') // Actualizar inventario de productos
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
  revalidatePath('/products') // Actualizar inventario de productos
  
  return movement
}

export async function convertConsignmentToSale(movementId: string) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  const movement = await crmService.convertConsignmentToSale(movementId)
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${movementId}`)
  revalidatePath('/crm/debts')
  revalidatePath('/products') // Actualizar inventario de productos
  
  return movement
}

export async function uploadMovementDocument(formData: FormData) {
  const supabase = await createClient()
  
  const file = formData.get('file') as File
  const movementId = formData.get('movementId') as string
  const documentType = formData.get('documentType') as 'invoice' | 'dispatch_order'

  if (!file || !movementId || !documentType) {
    return { success: false, error: 'Datos incompletos' }
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${movementId}/${documentType}-${Date.now()}.${fileExt}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('movement-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Error al subir el archivo' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('movement-documents')
      .getPublicUrl(fileName)

    // Update movement with document URL
    const updateField = documentType === 'invoice' ? 'invoice_url' : 'dispatch_order_url'
    
    const updateData: any = { [updateField]: publicUrl }

    if (documentType === 'invoice') {
      // If invoice date is not set, set it to today
      const { data: movement } = await supabase
        .from('product_movements')
        .select('invoice_date')
        .eq('id', movementId)
        .single()

      if (!movement?.invoice_date) {
        updateData.invoice_date = new Date().toISOString().split('T')[0]
      }
    }
    
    const { error: updateError } = await supabase
      .from('product_movements')
      .update(updateData)
      .eq('id', movementId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Error al actualizar el movimiento' }
    }

    revalidatePath(`/crm/movements/${movementId}`)
    return { success: true, url: publicUrl }

  } catch (error) {
    console.error('Upload document error:', error)
    return { success: false, error: 'Error al procesar el documento' }
  }
}

export async function deleteMovementDocument(
  movementId: string,
  documentType: 'invoice' | 'dispatch_order'
) {
  const supabase = await createClient()

  try {
    // Get current document URL to extract file path
    const { data: movement, error: fetchError } = await supabase
      .from('product_movements')
      .select('invoice_url, dispatch_order_url')
      .eq('id', movementId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Movimiento no encontrado' }
    }

    const currentUrl = documentType === 'invoice' 
      ? movement.invoice_url 
      : movement.dispatch_order_url

    if (currentUrl) {
      // Extract file path from URL
      const urlParts = currentUrl.split('/movement-documents/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        // Delete from storage
        await supabase.storage
          .from('movement-documents')
          .remove([filePath])
      }
    }

    // Clear document URL in movement
    const updateField = documentType === 'invoice' ? 'invoice_url' : 'dispatch_order_url'
    
    const { error: updateError } = await supabase
      .from('product_movements')
      .update({ [updateField]: null })
      .eq('id', movementId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Error al actualizar el movimiento' }
    }

    revalidatePath(`/crm/movements/${movementId}`)
    return { success: true }

  } catch (error) {
    console.error('Delete document error:', error)
    return { success: false, error: 'Error al eliminar el documento' }
  }
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

export async function updateMovement(
  movementId: string,
  data: {
    movement_type?: 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit' | 'sale_boleta'
    prospect_id?: string | null
    customer_user_id?: string | null
    items?: Array<{
      product_id: string
      variant_id?: string | null
      quantity: number
      unit_price: number
    }>
    total_amount?: number
    due_date?: string | null
    delivery_date?: string | null
    invoice_date?: string | null
    notes?: string | null
    sample_recipient_name?: string | null
    sample_event_context?: string | null
    boleta_buyer_name?: string | null
    status?: string
  }
) {
  const supabase = await createClient()
  const crmService = new CRMService(supabase)
  
  // If invoice_date is updated, check if we need to update due_date based on prospect terms
  if (data.invoice_date) {
    const movement = await crmService.getMovementById(movementId)
    
    if (movement?.prospect?.payment_terms_days) {
      const invoiceDate = new Date(data.invoice_date)
      // Add days to invoice date
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + movement.prospect.payment_terms_days)
      
      // Update due_date if not explicitly provided in this update
      if (!data.due_date) {
        data.due_date = dueDate.toISOString().split('T')[0]
      }
    }
  }
  
  const movement = await crmService.updateMovement(movementId, data)
  
  revalidatePath('/crm/movements')
  revalidatePath(`/crm/movements/${movementId}`)
  revalidatePath('/crm/debts')
  revalidatePath('/products') // Actualizar inventario de productos
  if (data.prospect_id) {
    revalidatePath(`/crm/prospects/${data.prospect_id}`)
  }
  
  return movement
}

export async function deleteMovement(movementId: string) {
  const supabase = await createAdminClient()
  
  // First delete related payments
  const { error: paymentsError } = await supabase
    .from('movement_payments')
    .delete()
    .eq('movement_id', movementId)

  if (paymentsError) {
    console.error('Error deleting payments:', paymentsError)
    throw new Error('Error al eliminar los pagos asociados')
  }

  // Then delete the movement
  const { error } = await supabase
    .from('product_movements')
    .delete()
    .eq('id', movementId)

  if (error) {
    console.error('Error deleting movement:', error)
    throw new Error('Error al eliminar el movimiento')
  }
  
  revalidatePath('/crm/movements')
  revalidatePath('/crm/debts')
  revalidatePath('/crm')
  revalidatePath('/products') // Actualizar inventario de productos
  
  return { success: true }
}
