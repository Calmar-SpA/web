'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProspect } from '../../actions'
import { Button, Input } from '@calmar/ui'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewProspectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: 'b2b' as 'b2b' | 'b2c',
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    tax_id: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createProspect({
        type: formData.type,
        company_name: formData.company_name || undefined,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone || undefined,
        tax_id: formData.tax_id || undefined,
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
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+56 9 1234 5678"
            className="h-12"
          />
        </div>

        {/* Tax ID (B2B only) */}
        {formData.type === 'b2b' && (
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
              RUT / Tax ID
            </label>
            <Input
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="12.345.678-9"
              className="h-12"
            />
          </div>
        )}

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
            disabled={isSubmitting}
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
