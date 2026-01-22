'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProspect } from '../../actions'
import { Button, Input, RutInput } from '@calmar/ui'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { isValidPhoneIntl, isValidRut } from '@calmar/utils'

export default function NewProspectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: 'b2b' as 'b2b' | 'b2c',
    company_name: '',
    contact_name: '',
    contact_role: '',
    email: '',
    phone: '',
    phone_country: '56',
    tax_id: '',
    address: '',
    city: '',
    comuna: '',
    business_activity: '',
    requesting_rut: '',
    shipping_address: '',
    notes: ''
  })

  const isTaxIdValid = formData.tax_id ? isValidRut(formData.tax_id) : false
  const isRequestingRutValid = !formData.requesting_rut || isValidRut(formData.requesting_rut)
  const isPhoneValid = !formData.phone || isValidPhoneIntl(formData.phone)

  const formatLocalPhone = (value: string) =>
    value.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!isValidRut(formData.tax_id)) {
      toast.error('El RUT no es válido')
      setIsSubmitting(false)
      return
    }
    if (formData.requesting_rut && !isValidRut(formData.requesting_rut)) {
      toast.error('El RUT solicita no es válido')
      setIsSubmitting(false)
      return
    }
    if (formData.phone && !isValidPhoneIntl(formData.phone)) {
      toast.error('El teléfono no es válido')
      setIsSubmitting(false)
      return
    }

    try {
      await createProspect({
        type: formData.type,
        company_name: formData.company_name || undefined,
        contact_name: formData.contact_name,
        contact_role: formData.contact_role || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        phone_country: formData.phone_country,
        tax_id: formData.tax_id || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        comuna: formData.comuna || undefined,
        business_activity: formData.business_activity || undefined,
        requesting_rut: formData.requesting_rut || undefined,
        shipping_address: formData.shipping_address || undefined,
        notes: formData.notes || undefined
      })
      
      toast.success('Prospecto creado exitosamente')
      router.push('/crm/prospects')
    } catch (error: any) {
      console.error('Error creating prospect:', error)
      toast.error(error.message || 'Error al crear prospecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/crm/prospects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Nuevo <span className="text-calmar-ocean">Prospecto</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Agregar un nuevo prospecto al sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm space-y-6">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-3">
            Tipo de Prospecto
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'b2b' })}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.type === 'b2b'
                  ? 'border-calmar-ocean bg-calmar-ocean/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-black uppercase tracking-wider">
                B2B
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Empresa
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'b2c' })}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.type === 'b2c'
                  ? 'border-calmar-ocean bg-calmar-ocean/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-black uppercase tracking-wider">
                B2C
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Consumidor Final
              </div>
            </button>
          </div>
        </div>

        {/* Company Name (B2B only) */}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              Nombre de la Empresa *
            </label>
            <Input
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Ej: Empresa XYZ S.A."
              className="h-12"
            />
          </div>
        )}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              Dirección empresa
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej: Av. Siempre Viva 123"
              className="h-12"
            />
          </div>
        )}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              Ciudad
            </label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ej: Santiago"
              className="h-12"
            />
          </div>
        )}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              Comuna
            </label>
            <Input
              value={formData.comuna}
              onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
              placeholder="Ej: Providencia"
              className="h-12"
            />
          </div>
        )}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              Giro
            </label>
            <Input
              value={formData.business_activity}
              onChange={(e) => setFormData({ ...formData, business_activity: e.target.value })}
              placeholder="Ej: Comercialización de alimentos"
              className="h-12"
            />
          </div>
        )}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              RUT solicita
            </label>
            <RutInput
              value={formData.requesting_rut}
              onChange={(e) => setFormData({ ...formData, requesting_rut: e.target.value })}
              placeholder="12.345.678-9"
              className="h-12"
            />
            {formData.requesting_rut && !isRequestingRutValid && (
              <p className="text-xs text-red-600 mt-1">RUT inválido</p>
            )}
          </div>
        )}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              Dirección de despacho
            </label>
            <Input
              value={formData.shipping_address}
              onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              placeholder="Ej: Bodega, calle 45 #120"
              className="h-12"
            />
          </div>
        )}

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Nombre de Contacto *
          </label>
          <Input
            required
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            placeholder="Ej: Juan Pérez"
            className="h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Cargo del Contacto
          </label>
          <Input
            value={formData.contact_role}
            onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
            placeholder="Ej: Jefe de Compras"
            className="h-12"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Email *
          </label>
          <Input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contacto@empresa.com"
            className="h-12"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Teléfono
          </label>
          <div className="flex gap-2">
            <select
              value={formData.phone_country}
              onChange={(e) => setFormData({ ...formData, phone_country: e.target.value })}
              className="h-12 w-28 rounded-xl border-2 border-slate-200 bg-white px-2 text-sm font-black uppercase tracking-wider text-slate-600"
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
              value={formatLocalPhone(formData.phone)}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              placeholder="Ej: 9 123 456 789"
              className="h-12"
            />
          </div>
          {formData.phone && !isPhoneValid && (
            <p className="text-xs text-red-600 mt-1">Teléfono inválido</p>
          )}
        </div>

        {/* RUT */}
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            RUT *
          </label>
          <RutInput
            required
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            placeholder="12.345.678-9"
            className="h-12"
          />
          {formData.tax_id && !isTaxIdValid && (
            <p className="text-xs text-red-600 mt-1">RUT inválido</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Formato: 12.345.678-9</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Información adicional sobre el prospecto..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <Link href="/crm/prospects" className="flex-1">
            <Button type="button" variant="outline" className="w-full uppercase font-black tracking-wider">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || !isTaxIdValid || !isRequestingRutValid || !isPhoneValid}
            className="flex-1 uppercase font-black tracking-wider"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar Prospecto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
