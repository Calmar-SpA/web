'use server'

import {
  sendB2BApprovedEmail,
  sendB2BRejectedEmail,
  sendProspectAdminNotification,
  sendRefundAdminNotification,
  sendTestEmail,
} from '@/lib/mail'

const getValue = (formData: FormData, key: string, fallback = '') => {
  const value = formData.get(key)
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return fallback
}

export async function sendGenericTestEmailAction(formData: FormData) {
  const to = getValue(formData, 'targetEmail')
  const subject = getValue(formData, 'subject', 'Prueba de correo SendGrid')
  const message = getValue(
    formData,
    'message',
    'Este es un correo de prueba para validar la configuracion de SendGrid.'
  )

  if (!to) {
    throw new Error('Debes indicar un correo destino')
  }

  await sendTestEmail({ to, subject, message })
}

export async function sendB2BApprovedTestAction(formData: FormData) {
  const contactEmail = getValue(formData, 'targetEmail')
  const contactName = getValue(formData, 'contactName', 'Cliente Calmar')
  const companyName = getValue(formData, 'companyName', 'Empresa Demo')
  const creditLimit = Number(getValue(formData, 'creditLimit', '150000'))
  const paymentTermsDays = Number(getValue(formData, 'paymentTermsDays', '30'))

  if (!contactEmail) {
    throw new Error('Debes indicar un correo destino')
  }

  await sendB2BApprovedEmail({
    contactName,
    contactEmail,
    companyName,
    creditLimit,
    paymentTermsDays,
  })
}

export async function sendB2BRejectedTestAction(formData: FormData) {
  const contactEmail = getValue(formData, 'targetEmail')
  const contactName = getValue(formData, 'contactName', 'Cliente Calmar')
  const companyName = getValue(formData, 'companyName', 'Empresa Demo')

  if (!contactEmail) {
    throw new Error('Debes indicar un correo destino')
  }

  await sendB2BRejectedEmail({
    contactName,
    contactEmail,
    companyName,
  })
}

export async function sendProspectAdminTestAction(formData: FormData) {
  const contactName = getValue(formData, 'contactName', 'Prospecto Demo')
  const email = getValue(formData, 'targetEmail', 'contacto@calmar.cl')
  const phone = getValue(formData, 'phone', '+56 9 1234 5678')
  const type = getValue(formData, 'prospectType', 'b2b')
  const companyName = getValue(formData, 'companyName', 'Empresa Demo')
  const taxId = getValue(formData, 'taxId', '76.123.456-7')
  const notes = getValue(formData, 'notes', 'Prueba desde el panel admin.')

  await sendProspectAdminNotification({
    contactName,
    email,
    phone,
    type,
    companyName,
    taxId,
    notes,
  })
}

export async function sendRefundAdminTestAction(formData: FormData) {
  const referenceId = getValue(formData, 'referenceId', 'REF-TEST-001')
  const reason = getValue(formData, 'reason', 'Prueba de devolucion desde admin')

  await sendRefundAdminNotification({
    referenceId,
    reason,
  })
}
