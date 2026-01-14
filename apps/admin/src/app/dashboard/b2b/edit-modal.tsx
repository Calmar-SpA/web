'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { X, Edit3, Percent, DollarSign, Calendar } from 'lucide-react'
import { updateB2BClient } from './actions'
import { toast } from 'sonner'

interface EditModalProps {
  client: {
    id: string
    company_name: string
    discount_percentage: number
    credit_limit: number
    payment_terms_days: number
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditModal({
  client,
  isOpen,
  onClose,
  onSuccess
}: EditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    discount_percentage: client.discount_percentage,
    credit_limit: client.credit_limit,
    payment_terms_days: client.payment_terms_days
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: Number(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await updateB2BClient(client.id, formData)
      if (result.success) {
        toast.success('Cambios guardados con éxito')
        onSuccess()
        onClose()
      }
    } catch (error) {
      toast.error('Error al guardar los cambios')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl flex flex-row items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Edit3 className="h-6 w-6 text-calmar-mint" />
            <CardTitle className="text-xl uppercase tracking-tight">Editar B2B</CardTitle>
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
        <CardContent className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Actualiza las condiciones comerciales para <strong className="text-slate-900">{client.company_name}</strong>.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Porcentaje de Descuento (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  name="discount_percentage" 
                  value={formData.discount_percentage}
                  onChange={handleChange}
                  className="pl-10" 
                  required 
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Línea de Crédito (CLP)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  name="credit_limit" 
                  value={formData.credit_limit}
                  onChange={handleChange}
                  className="pl-10" 
                  required 
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Días de Pago</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  name="payment_terms_days" 
                  value={formData.payment_terms_days}
                  onChange={handleChange}
                  className="pl-10" 
                  required 
                  min="0"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-calmar-ocean text-white h-12 text-sm font-bold uppercase mt-6 shadow-xl gap-2 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
