'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { X, ShieldCheck, Percent, DollarSign, Calendar } from 'lucide-react'
import { approveB2BClient } from './actions'
import { toast } from 'sonner'

interface ApproveModalProps {
  clientId: string
  companyName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ApproveModal({
  clientId,
  companyName,
  isOpen,
  onClose,
  onSuccess
}: ApproveModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    discount: 10,
    creditLimit: 1000000,
    paymentTermsDays: 30
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
      const result = await approveB2BClient(clientId, formData)
      if (result.success) {
        toast.success('Cliente aprobado con éxito')
        onSuccess()
        onClose()
      }
    } catch (error) {
      toast.error('Error al aprobar el cliente')
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
            <ShieldCheck className="h-6 w-6 text-calmar-mint" />
            <CardTitle className="text-xl uppercase tracking-tight">Aprobar B2B</CardTitle>
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
            Configura las condiciones comerciales para <strong className="text-slate-900">{companyName}</strong>.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Porcentaje de Descuento (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  name="discount" 
                  value={formData.discount}
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
                  name="creditLimit" 
                  value={formData.creditLimit}
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
                  name="paymentTermsDays" 
                  value={formData.paymentTermsDays}
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
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white h-12 text-sm font-bold uppercase mt-6 shadow-xl gap-2 transition-colors"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar aprobación'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
