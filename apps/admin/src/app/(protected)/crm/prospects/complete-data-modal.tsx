'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, RutInput } from '@calmar/ui'
import { X, AlertTriangle } from 'lucide-react'
import { isValidPhoneIntl, isValidRut, parsePhoneIntl } from '@calmar/utils'
import { toast } from 'sonner'
import { updateProspect } from '../actions'

export type ProspectForCompletion = {
  id: string
  type?: 'b2b' | 'b2c'
  company_name?: string | null
  fantasy_name?: string | null
  contact_name?: string | null
  contact_role?: string | null
  email?: string | null
  phone?: string | null
  tax_id?: string | null
  address?: string | null
  city?: string | null
  comuna?: string | null
  business_activity?: string | null
  requesting_rut?: string | null
  shipping_address?: string | null
  notes?: string | null
  is_b2b_active?: boolean | null
}

type MissingField = { key: keyof ProspectForCompletion; label: string }

const REQUIRED_FIELDS: MissingField[] = [
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

export function getMissingProspectFields(prospect: ProspectForCompletion) {
  const parsedPhone = parsePhoneIntl(prospect.phone || '')
  const phoneDigits = parsedPhone.digits || ''

  return REQUIRED_FIELDS.filter(({ key }) => {
    if (key === 'phone') {
      return isBlank(phoneDigits) || !isValidPhoneIntl(phoneDigits)
    }
    if (key === 'tax_id') {
      return isBlank(prospect.tax_id) || !isValidRut(String(prospect.tax_id))
    }
    if (key === 'requesting_rut') {
      return isBlank(prospect.requesting_rut) || !isValidRut(String(prospect.requesting_rut))
    }
    if (key === 'type') {
      return prospect.type !== 'b2b' && prospect.type !== 'b2c'
    }
    return isBlank(prospect[key] as string | null | undefined)
  })
}

interface CompleteDataModalProps {
  prospect: ProspectForCompletion | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CompleteDataModal({ prospect, isOpen, onClose, onSuccess }: CompleteDataModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneCountry, setPhoneCountry] = useState('56')
  const [phoneValue, setPhoneValue] = useState('')
  const [taxIdValue, setTaxIdValue] = useState('')
  const [requestingRutValue, setRequestingRutValue] = useState('')

  useEffect(() => {
    if (!prospect) return
    const parsedPhone = parsePhoneIntl(prospect.phone || '')
    setPhoneValue(parsedPhone.digits || '')
    setPhoneCountry(parsedPhone.countryCode || '56')
    setTaxIdValue(prospect.tax_id || '')
    setRequestingRutValue(prospect.requesting_rut || '')
  }, [prospect])

  const missingFields = useMemo(
    () => (prospect ? getMissingProspectFields(prospect) : []),
    [prospect]
  )

  const isTaxIdValid = !taxIdValue || isValidRut(taxIdValue)
  const isRequestingRutValid = !requestingRutValue || isValidRut(requestingRutValue)
  const isPhoneValid = !phoneValue || isValidPhoneIntl(phoneValue)
  const isFormValid = isTaxIdValid && isRequestingRutValid && isPhoneValid

  const formatLocalPhone = (value: string) =>
    value.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')

  if (!isOpen || !prospect) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid) {
      toast.error('Revisa los datos ingresados')
      return
    }

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await updateProspect(prospect.id, formData)
      toast.success('Datos actualizados')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating prospect:', error)
      toast.error(error?.message || 'No se pudo actualizar la ficha')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <Card className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border-none bg-white text-slate-900 shadow-2xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-calmar-mint" />
            <CardTitle className="text-lg uppercase tracking-tight">Completar ficha</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="bg-white p-5 sm:p-6 overflow-y-auto flex-1">
          <p className="text-sm text-slate-500 mb-4">
            Para marcar este prospecto como activo necesitamos completar todos los datos de la ficha.
          </p>
          {missingFields.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <p className="font-bold uppercase tracking-wider text-[10px] mb-2">Campos faltantes</p>
              <p>{missingFields.map(field => field.label).join(', ')}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Tipo
              </label>
              <select
                name="type"
                defaultValue={prospect.type || 'b2b'}
                className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                required
              >
                <option value="b2b">B2B</option>
                <option value="b2c">B2C</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Razón Social
              </label>
              <Input name="company_name" defaultValue={prospect.company_name || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Nombre de Fantasía
              </label>
              <Input name="fantasy_name" defaultValue={prospect.fantasy_name || ''} className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Nombre de Contacto
              </label>
              <Input name="contact_name" defaultValue={prospect.contact_name || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Cargo del Contacto
              </label>
              <Input name="contact_role" defaultValue={prospect.contact_role || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Email
              </label>
              <Input name="email" type="email" defaultValue={prospect.email || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Teléfono
              </label>
              <div className="flex gap-2">
                <select
                  name="phone_country"
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value)}
                  className="h-11 w-28 rounded-xl border-2 border-slate-200 bg-white px-2 text-sm font-black uppercase tracking-wider text-slate-600"
                  required
                >
                  <option value="56">+56</option>
                  <option value="54">+54</option>
                  <option value="51">+51</option>
                  <option value="57">+57</option>
                  <option value="52">+52</option>
                  <option value="55">+55</option>
                  <option value="34">+34</option>
                  <option value="1">+1</option>
                </select>
                <Input
                  name="phone"
                  value={formatLocalPhone(phoneValue)}
                  onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ''))}
                  className="h-11"
                  required
                />
              </div>
              {!isPhoneValid && <p className="text-xs text-red-600">Teléfono inválido</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                RUT
              </label>
              <RutInput
                name="tax_id"
                value={taxIdValue}
                onChange={(e) => setTaxIdValue(e.target.value)}
                placeholder="12.345.678-9"
                className="h-11"
                required
              />
              {!isTaxIdValid && <p className="text-xs text-red-600">RUT inválido</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Dirección empresa
              </label>
              <Input name="address" defaultValue={prospect.address || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Ciudad
              </label>
              <Input name="city" defaultValue={prospect.city || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Comuna
              </label>
              <Input name="comuna" defaultValue={prospect.comuna || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Giro
              </label>
              <Input name="business_activity" defaultValue={prospect.business_activity || ''} className="h-11" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                RUT solicita
              </label>
              <RutInput
                name="requesting_rut"
                value={requestingRutValue}
                onChange={(e) => setRequestingRutValue(e.target.value)}
                placeholder="12.345.678-9"
                className="h-11"
                required
              />
              {!isRequestingRutValid && <p className="text-xs text-red-600">RUT inválido</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Dirección de despacho
              </label>
              <Input name="shipping_address" defaultValue={prospect.shipping_address || ''} className="h-11" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Notas
              </label>
              <textarea
                name="notes"
                defaultValue={prospect.notes || ''}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm resize-none"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="uppercase font-black tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar y continuar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
