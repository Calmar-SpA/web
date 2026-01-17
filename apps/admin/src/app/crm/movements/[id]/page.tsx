'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { ArrowLeft, DollarSign, Calendar, Package, AlertCircle, CheckCircle, Plus, UserX } from 'lucide-react'
import { Button, Input } from '@calmar/ui'
import Link from 'next/link'
import { updateMovementStatus, registerPayment, returnConsignment, convertConsignmentToSale } from '../../actions'
import { toast } from 'sonner'

const STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Entregado', color: 'bg-blue-100 text-blue-700' },
  returned: { label: 'Devuelto', color: 'bg-gray-100 text-gray-700' },
  sold: { label: 'Vendido', color: 'bg-green-100 text-green-700' },
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
  partial_paid: { label: 'Pago Parcial', color: 'bg-amber-100 text-amber-700' },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700' }
}

export default function MovementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const movementId = params.id as string
  
  const [movement, setMovement] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'transfer' as 'cash' | 'transfer' | 'check' | 'credit_card' | 'other',
    payment_reference: '',
    notes: ''
  })

  const loadMovement = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      const data = await crmService.getMovementById(movementId)
      setMovement(data)
    } catch (error: any) {
      console.error('Error loading movement:', error)
      toast.error('Error al cargar movimiento')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (movementId) {
      loadMovement()
    }
  }, [movementId])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateMovementStatus(movementId, newStatus)
      await loadMovement()
      toast.success('Estado actualizado')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    try {
      await registerPayment({
        movement_id: movementId,
        amount,
        payment_method: paymentForm.payment_method,
        payment_reference: paymentForm.payment_reference || undefined,
        notes: paymentForm.notes || undefined
      })
      
      toast.success('Pago registrado')
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        payment_method: 'transfer',
        payment_reference: '',
        notes: ''
      })
      await loadMovement()
    } catch (error: any) {
      console.error('Error registering payment:', error)
      toast.error('Error al registrar pago')
    }
  }

  const handleReturnConsignment = async () => {
    if (!confirm('¿Estás seguro de devolver esta consignación? Esto restaurará el stock.')) {
      return
    }

    try {
      await returnConsignment(movementId, movement.items)
      await loadMovement()
      toast.success('Consignación devuelta')
    } catch (error: any) {
      console.error('Error returning consignment:', error)
      toast.error('Error al devolver consignación')
    }
  }

  const handleConvertToSale = async () => {
    if (!confirm('¿Convertir esta consignación en venta? Esto actualizará el estado.')) {
      return
    }

    try {
      await convertConsignmentToSale(movementId)
      await loadMovement()
      toast.success('Consignación convertida a venta')
    } catch (error: any) {
      console.error('Error converting to sale:', error)
      toast.error('Error al convertir consignación')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando...</p>
      </div>
    )
  }

  if (!movement) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Movimiento no encontrado</p>
        <Link href="/crm/movements">
          <Button>Volver a Movimientos</Button>
        </Link>
      </div>
    )
  }

  const totalPaid = movement.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  const remainingBalance = Number(movement.total_amount) - totalPaid
  const statusInfo = STATUSES[movement.status as keyof typeof STATUSES]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/movements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            {movement.movement_number}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {movement.movement_type === 'sample' ? 'Muestra' :
             movement.movement_type === 'consignment' ? 'Consignación' :
             movement.movement_type === 'sale_invoice' ? 'Venta Factura' : 'Venta Crédito'}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider ${statusInfo?.color || 'bg-slate-100 text-slate-700'}`}>
          {statusInfo?.label || movement.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Cliente / Receptor</h2>
            {movement.prospect && (
              <div>
                <p className="font-bold text-slate-900">{movement.prospect.contact_name}</p>
                {movement.prospect.company_name && (
                  <p className="text-sm text-slate-600">{movement.prospect.company_name}</p>
                )}
                <p className="text-sm text-slate-600">{movement.prospect.email}</p>
              </div>
            )}
            {movement.b2b_client && (
              <div>
                <p className="font-bold text-slate-900">{movement.b2b_client.company_name}</p>
                <p className="text-sm text-slate-600">{movement.b2b_client.contact_email}</p>
              </div>
            )}
            {movement.customer && (
              <div>
                <p className="font-bold text-slate-900">{movement.customer.full_name || movement.customer.email}</p>
                <p className="text-sm text-slate-600">{movement.customer.email}</p>
              </div>
            )}
            {/* Anonymous sample recipient */}
            {movement.movement_type === 'sample' && 
             !movement.prospect && 
             !movement.b2b_client && 
             !movement.customer && 
             (movement.sample_recipient_name || movement.sample_event_context) && (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Muestra sin cliente asociado
                  </span>
                </div>
                {movement.sample_recipient_name && (
                  <p className="font-bold text-slate-900">
                    Receptor: {movement.sample_recipient_name}
                  </p>
                )}
                {movement.sample_event_context && (
                  <p className="text-sm text-slate-600 mt-1">
                    Contexto: {movement.sample_event_context}
                  </p>
                )}
              </div>
            )}
            {/* No client assigned */}
            {!movement.prospect && 
             !movement.b2b_client && 
             !movement.customer && 
             !movement.sample_recipient_name && 
             !movement.sample_event_context && (
              <p className="text-sm text-slate-400 italic">Sin cliente asignado</p>
            )}
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Productos</h2>
            <div className="space-y-3">
              {movement.items?.map((item: any, index: number) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">
                        Producto ID: {item.product_id}
                      </p>
                      {item.variant_id && (
                        <p className="text-sm text-slate-600">Variante ID: {item.variant_id}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Cantidad: {item.quantity}</p>
                      <p className="text-sm font-bold text-slate-900">
                        ${item.unit_price.toLocaleString('es-CL')} c/u
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        Total: ${(item.quantity * item.unit_price).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          {movement.movement_type !== 'sample' && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black uppercase tracking-tight">Pagos</h2>
                {remainingBalance > 0 && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="uppercase font-black tracking-wider"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                )}
              </div>

              <div className="space-y-3 mb-4">
                {movement.payments && movement.payments.length > 0 ? (
                  movement.payments.map((payment: any) => (
                    <div key={payment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900">
                            ${Number(payment.amount).toLocaleString('es-CL')}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {payment.payment_method} 
                            {payment.payment_reference && ` - Ref: ${payment.payment_reference}`}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(payment.paid_at).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No hay pagos registrados</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-700">Total:</span>
                  <span className="text-lg font-black text-slate-900">
                    ${Number(movement.total_amount).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-700">Pagado:</span>
                  <span className="text-lg font-black text-green-600">
                    ${totalPaid.toLocaleString('es-CL')}
                  </span>
                </div>
                {remainingBalance > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-sm font-black uppercase tracking-wider text-orange-600">
                      Pendiente:
                    </span>
                    <span className="text-xl font-black text-orange-600">
                      ${remainingBalance.toLocaleString('es-CL')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {movement.notes && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Notas</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{movement.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Estado</h2>
            <select
              value={movement.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none font-bold uppercase tracking-wider text-sm"
            >
              {Object.entries(STATUSES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Fechas</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Creado
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(movement.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
              {movement.delivery_date && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    Entrega
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(movement.delivery_date).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
              {movement.due_date && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    Vencimiento
                  </p>
                  <p className={`text-sm font-medium ${
                    new Date(movement.due_date) < new Date() && remainingBalance > 0
                      ? 'text-red-600'
                      : 'text-slate-900'
                  }`}>
                    {new Date(movement.due_date).toLocaleDateString('es-CL')}
                    {new Date(movement.due_date) < new Date() && remainingBalance > 0 && (
                      <AlertCircle className="w-4 h-4 inline-block ml-2" />
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {movement.movement_type === 'consignment' && movement.status === 'delivered' && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Acciones</h2>
              <div className="space-y-3">
                <Button
                  onClick={handleConvertToSale}
                  className="w-full uppercase font-black tracking-wider"
                >
                  Convertir a Venta
                </Button>
                <Button
                  onClick={handleReturnConsignment}
                  variant="outline"
                  className="w-full uppercase font-black tracking-wider"
                >
                  Devolver Consignación
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">Registrar Pago</h2>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Monto *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder={`Máximo: ${remainingBalance.toLocaleString('es-CL')}`}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none"
                  required
                >
                  <option value="transfer">Transferencia</option>
                  <option value="cash">Efectivo</option>
                  <option value="check">Cheque</option>
                  <option value="credit_card">Tarjeta de Crédito</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Referencia
                </label>
                <Input
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                  placeholder="Número de transacción, cheque, etc."
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentForm({
                      amount: '',
                      payment_method: 'transfer',
                      payment_reference: '',
                      notes: ''
                    })
                  }}
                  className="flex-1 uppercase font-black tracking-wider"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 uppercase font-black tracking-wider"
                >
                  Registrar Pago
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
