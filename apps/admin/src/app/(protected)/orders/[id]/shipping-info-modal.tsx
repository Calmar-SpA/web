'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { X, Truck, Hash, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrderStatusWithShipping } from '../actions'

interface ShippingInfoModalProps {
  orderId: string
  orderNumber: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ShippingInfoModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: ShippingInfoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    trackingNumber: '',
    courierService: '',
    notes: '',
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.trackingNumber.trim() || !formData.courierService.trim()) {
      toast.error('El número de seguimiento y la empresa de courier son obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      await updateOrderStatusWithShipping(orderId, {
        trackingNumber: formData.trackingNumber.trim(),
        courierService: formData.courierService.trim(),
        notes: formData.notes.trim() || undefined,
      })
      toast.success('Pedido marcado como enviado')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('Error al actualizar el pedido')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl border-none bg-white text-slate-900 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-calmar-mint" />
            <CardTitle className="text-base uppercase tracking-tight">Información de envío</CardTitle>
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

        <CardContent className="p-5">
          <p className="text-xs text-slate-500 mb-5">
            Pedido <span className="font-bold text-slate-700">{orderNumber}</span>. Se notificará al cliente por correo con estos datos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Empresa de Courier <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  name="courierService"
                  value={formData.courierService}
                  onChange={handleChange}
                  placeholder="Ej: Starken, Chilexpress, Blue Express"
                  className="pl-9"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                N° de Seguimiento <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  placeholder="Ej: 123456789"
                  className="pl-9 font-mono"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Comentarios adicionales <span className="text-slate-300">(opcional)</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Instrucciones especiales, estado del empaque, etc."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-10 text-xs font-bold uppercase tracking-widest"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-widest"
              >
                {isSubmitting ? 'Enviando...' : 'Marcar como Enviado'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
