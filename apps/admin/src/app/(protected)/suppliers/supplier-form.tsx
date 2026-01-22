'use client'

import { useMemo, useState } from 'react'
import { Button, Input, RutInput } from '@calmar/ui'
import { isValidPhoneIntl, isValidRut, parsePhoneIntl } from '@calmar/utils'

type SupplierFormDefaults = {
  name?: string | null
  tax_id?: string | null
  business_name?: string | null
  contact_name?: string | null
  contact_role?: string | null
  address?: string | null
  city?: string | null
  comuna?: string | null
  business_activity?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  delivery_rut?: string | null
  pickup_address?: string | null
  notes?: string | null
}

type SupplierFormProps = {
  action: (formData: FormData) => void
  submitLabel: string
  defaultValues?: SupplierFormDefaults
  footerNote?: string
}

export function SupplierForm({ action, submitLabel, defaultValues, footerNote }: SupplierFormProps) {
  const initialPhone = parsePhoneIntl(defaultValues?.contact_phone)
  const [taxIdValue, setTaxIdValue] = useState(defaultValues?.tax_id ?? '')
  const [deliveryRutValue, setDeliveryRutValue] = useState(defaultValues?.delivery_rut ?? '')
  const [phoneCountry, setPhoneCountry] = useState(initialPhone.countryCode || '56')
  const [phoneValue, setPhoneValue] = useState(initialPhone.digits || '')

  const isTaxIdValid = useMemo(
    () => !taxIdValue || isValidRut(taxIdValue),
    [taxIdValue]
  )
  const isDeliveryRutValid = useMemo(
    () => !deliveryRutValue || isValidRut(deliveryRutValue),
    [deliveryRutValue]
  )
  const isPhoneValid = useMemo(
    () => !phoneValue || isValidPhoneIntl(phoneValue),
    [phoneValue]
  )
  const isFormValid = isTaxIdValid && isDeliveryRutValid && isPhoneValid

  const formatLocalPhone = (value: string) =>
    value.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')

  const phoneOptions = [
    { code: '56', label: 'Chile' },
    { code: '54', label: 'Argentina' },
    { code: '51', label: 'Perú' },
    { code: '57', label: 'Colombia' },
    { code: '52', label: 'México' },
    { code: '55', label: 'Brasil' },
    { code: '34', label: 'España' },
    { code: '1', label: 'USA/Canadá' },
  ]

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre *</label>
        <Input name="name" defaultValue={defaultValues?.name ?? ''} required />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">RUT</label>
        <RutInput
          name="tax_id"
          value={taxIdValue}
          onChange={(e) => setTaxIdValue(e.target.value)}
          placeholder="12.345.678-9"
          className="aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-200"
        />
        {!isTaxIdValid && <p className="text-xs text-red-600">RUT inválido</p>}
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Razón Social</label>
        <Input name="business_name" defaultValue={defaultValues?.business_name ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contacto</label>
        <Input name="contact_name" defaultValue={defaultValues?.contact_name ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargo contacto</label>
        <Input name="contact_role" defaultValue={defaultValues?.contact_role ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dirección empresa</label>
        <Input name="address" defaultValue={defaultValues?.address ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ciudad</label>
        <Input name="city" defaultValue={defaultValues?.city ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comuna</label>
        <Input name="comuna" defaultValue={defaultValues?.comuna ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giro</label>
        <Input name="business_activity" defaultValue={defaultValues?.business_activity ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
        <Input name="contact_email" type="email" defaultValue={defaultValues?.contact_email ?? ''} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teléfono</label>
        <div className="flex gap-2">
          <select
            name="contact_phone_country"
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
            className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold uppercase tracking-wider text-slate-600"
          >
            {phoneOptions.map((option) => (
              <option key={option.code} value={option.code}>
                +{option.code}
              </option>
            ))}
          </select>
          <Input
            name="contact_phone"
            value={formatLocalPhone(phoneValue)}
            onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 9 123 456 789"
          />
        </div>
        {!isPhoneValid && <p className="text-xs text-red-600">Teléfono inválido</p>}
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">RUT entrega</label>
        <RutInput
          name="delivery_rut"
          value={deliveryRutValue}
          onChange={(e) => setDeliveryRutValue(e.target.value)}
          placeholder="12.345.678-9"
          className="aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-200"
        />
        {!isDeliveryRutValid && <p className="text-xs text-red-600">RUT inválido</p>}
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dirección de retiro</label>
        <Input name="pickup_address" defaultValue={defaultValues?.pickup_address ?? ''} />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
        <textarea
          name="notes"
          defaultValue={defaultValues?.notes ?? ''}
          className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
          placeholder="Observaciones del proveedor..."
        />
      </div>
      <div className="md:col-span-2 flex items-center justify-between">
        {footerNote ? <p className="text-xs text-slate-500">{footerNote}</p> : <span />}
        <Button
          disabled={!isFormValid}
          className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
