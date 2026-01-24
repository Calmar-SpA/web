'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, CheckCircle2, XCircle, Eye, Loader2, CreditCard, Calendar, User } from 'lucide-react'
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from '@calmar/ui'
import Link from 'next/link'
import { toast } from 'sonner'
import { approvePayment, rejectPayment } from '../actions'
import { formatClp } from '@calmar/utils'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadPayments = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      let query = supabase
        .from('movement_payments')
        .select(`
          *,
          movement:product_movements(
            id, 
            movement_number, 
            movement_type,
            prospect:prospects(contact_name, company_name),
            customer:users!customer_user_id(full_name, email)
          )
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('verification_status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setPayments(data || [])
    } catch (error: any) {
      console.error('Error loading payments:', error)
      toast.error('Error al cargar pagos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [filterStatus])

  const handleApprove = async (id: string) => {
    if (!confirm('¿Estás seguro de aprobar este pago?')) return
    
    setProcessingId(id)
    try {
      await approvePayment(id)
      toast.success('Pago aprobado')
      loadPayments()
    } catch (error) {
      toast.error('Error al aprobar pago')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo del rechazo:')
    if (reason === null) return
    if (!reason.trim()) {
      toast.error('Debes ingresar un motivo')
      return
    }

    setProcessingId(id)
    try {
      await rejectPayment(id, reason)
      toast.success('Pago rechazado')
      loadPayments()
    } catch (error) {
      toast.error('Error al rechazar pago')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase()
    const movement = payment.movement
    const clientName = movement?.prospect?.company_name || movement?.prospect?.contact_name || movement?.customer?.full_name || ''
    const movementNum = movement?.movement_number || ''
    
    return clientName.toLowerCase().includes(searchLower) || 
           movementNum.toLowerCase().includes(searchLower) ||
           payment.payment_reference?.toLowerCase().includes(searchLower)
  })

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Verificación de Pagos</h1>
          <p className="text-slate-500">Gestiona los pagos por transferencia pendientes de revisión</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={filterStatus === 'pending' ? 'border-amber-500 bg-amber-50' : ''} onClick={() => setFilterStatus('pending')}>
          <CardContent className="pt-6 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Pendientes</span>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black mt-2">{payments.filter(p => p.verification_status === 'pending').length}</p>
          </CardContent>
        </Card>
        
        <Card className={filterStatus === 'approved' ? 'border-emerald-500 bg-emerald-50' : ''} onClick={() => setFilterStatus('approved')}>
          <CardContent className="pt-6 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Aprobados</span>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black mt-2">{payments.filter(p => p.verification_status === 'approved').length}</p>
          </CardContent>
        </Card>

        <Card className={filterStatus === 'rejected' ? 'border-red-500 bg-red-50' : ''} onClick={() => setFilterStatus('rejected')}>
          <CardContent className="pt-6 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Rechazados</span>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black mt-2">{payments.filter(p => p.verification_status === 'rejected').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente, movimiento o referencia..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente / Movimiento</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Monto</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Referencia</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Comprobante</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Cargando pagos...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron pagos
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(payment.created_at).toLocaleDateString('es-CL')}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(payment.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          {payment.movement?.prospect?.company_name || payment.movement?.prospect?.contact_name || payment.movement?.customer?.full_name || 'N/A'}
                        </span>
                        <Link 
                          href={`/crm/movements/${payment.movement_id}`}
                          className="text-[10px] font-bold text-calmar-ocean hover:underline"
                        >
                          {payment.movement?.movement_number || 'Ver movimiento'}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">
                        ${formatClp(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500">
                        {payment.payment_reference || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payment.payment_proof_url ? (
                        <a 
                          href={payment.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-calmar-ocean hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.verification_status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleApprove(payment.id)}
                            disabled={!!processingId}
                          >
                            {processingId === payment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(payment.id)}
                            disabled={!!processingId}
                          >
                            {processingId === payment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                          payment.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.verification_status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
