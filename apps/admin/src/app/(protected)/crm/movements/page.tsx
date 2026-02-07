'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { Search, Plus, Package, DollarSign, Calendar, AlertCircle, CheckCircle, UserX, Trash2, FileText } from 'lucide-react'
import { deleteMovement } from '../actions'
import { Input, Button } from '@calmar/ui'
import Link from 'next/link'
import { toast } from 'sonner'

const MOVEMENT_TYPES = {
  sample: { label: 'Muestra', color: 'bg-purple-100 text-purple-700' },
  consignment: { label: 'Consignación', color: 'bg-indigo-100 text-indigo-700' },
  sale_invoice: { label: 'Venta Factura', color: 'bg-green-100 text-green-700' },
  sale_credit: { label: 'Venta Crédito', color: 'bg-orange-100 text-orange-700' }
}

const STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Entregado', color: 'bg-blue-100 text-blue-700' },
  returned: { label: 'Devuelto', color: 'bg-gray-100 text-gray-700' },
  sold: { label: 'Vendido', color: 'bg-green-100 text-green-700' },
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
  partial_paid: { label: 'Pago Parcial', color: 'bg-amber-100 text-amber-700' },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700' }
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadMovements = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      const filters: any = {}
      if (filterType !== 'all') {
        filters.movement_type = filterType
      }
      if (filterStatus !== 'all') {
        filters.status = filterStatus
      }
      
      const data = await crmService.getMovements(filters)
      setMovements(data || [])
    } catch (error: any) {
      console.error('Error loading movements:', error?.message || error)
      toast.error('Error al cargar movimientos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [filterType, filterStatus])

  const handleDelete = async (e: React.MouseEvent, movementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('¿Estás seguro de eliminar este movimiento? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(movementId)
    try {
      await deleteMovement(movementId)
      toast.success('Movimiento eliminado')
      await loadMovements()
    } catch (error: any) {
      console.error('Error deleting movement:', error)
      toast.error('Error al eliminar movimiento')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredMovements = movements.filter(m => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        m.movement_number?.toLowerCase().includes(search) ||
        m.prospect?.fantasy_name?.toLowerCase().includes(search) ||
        m.prospect?.contact_name?.toLowerCase().includes(search) ||
        m.prospect?.company_name?.toLowerCase().includes(search) ||
        m.b2b_client?.company_name?.toLowerCase().includes(search) ||
        m.customer?.email?.toLowerCase().includes(search) ||
        m.sample_recipient_name?.toLowerCase().includes(search) ||
        m.sample_event_context?.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Movimientos de <span className="text-calmar-ocean">Productos</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Muestras, consignaciones y ventas registradas
          </p>
        </div>
        <Link href="/crm/movements/new">
          <Button className="uppercase font-black tracking-wider">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, cliente, prospecto..."
            className="pl-10 h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Type Filter */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            {Object.entries(MOVEMENT_TYPES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filterType === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            {Object.entries(STATUSES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filterStatus === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movements List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Movimientos...</p>
        </div>
      ) : filteredMovements.length > 0 ? (
        <div className="space-y-4">
          {filteredMovements.map((movement) => {
            const typeInfo = MOVEMENT_TYPES[movement.movement_type as keyof typeof MOVEMENT_TYPES]
            const statusInfo = STATUSES[movement.status as keyof typeof STATUSES]
            const remainingBalance = Number(movement.total_amount) - Number(movement.amount_paid || 0)
            
            return (
              <div
                key={movement.id}
                className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-calmar-ocean transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <Link href={`/crm/movements/${movement.id}`} className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${typeInfo?.color || 'bg-slate-100 text-slate-700'}`}>
                        {typeInfo?.label || movement.movement_type}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${statusInfo?.color || 'bg-slate-100 text-slate-700'}`}>
                        {statusInfo?.label || movement.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">
                      {movement.movement_number}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {movement.prospect && (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {movement.prospect.fantasy_name || movement.prospect.contact_name}
                        </span>
                      )}
                      {movement.b2b_client && (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {movement.b2b_client.company_name}
                        </span>
                      )}
                      {movement.customer && (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {movement.customer.email}
                        </span>
                      )}
                      {/* Anonymous sample recipient */}
                      {movement.movement_type === 'sample' && 
                       !movement.prospect && 
                       !movement.b2b_client && 
                       !movement.customer && 
                       (movement.sample_recipient_name || movement.sample_event_context) && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <UserX className="w-4 h-4" />
                          {movement.sample_recipient_name || movement.sample_event_context}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                          Total
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                          ${Number(movement.total_amount).toLocaleString('es-CL')}
                        </p>
                      </div>
                      {movement.movement_type !== 'sample' && remainingBalance > 0 && (
                        <div className="text-right">
                          <p className="text-xs font-black uppercase tracking-wider text-orange-600 mb-1">
                            Pendiente
                          </p>
                          <p className="text-lg font-black text-orange-600">
                            ${remainingBalance.toLocaleString('es-CL')}
                          </p>
                        </div>
                      )}
                      {movement.invoice_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <FileText className="w-3 h-3" />
                          <span>
                            Factura: {new Date(movement.invoice_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                          </span>
                        </div>
                      )}

                      {movement.invoice_date && movement.prospect?.payment_terms_days && (
                        <div className={`flex items-center gap-1 text-xs ${
                          (() => {
                            const invoiceDate = new Date(movement.invoice_date)
                            const maxDate = new Date(invoiceDate)
                            maxDate.setDate(maxDate.getDate() + movement.prospect.payment_terms_days)
                            return maxDate < new Date() && remainingBalance > 0 ? 'text-red-600 font-bold' : 'text-slate-500'
                          })()
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>
                            Plazo: {(() => {
                              const invoiceDate = new Date(movement.invoice_date)
                              const maxDate = new Date(invoiceDate)
                              maxDate.setDate(maxDate.getDate() + movement.prospect.payment_terms_days)
                              return maxDate.toLocaleDateString('es-CL', { timeZone: 'UTC' })
                            })()}
                          </span>
                        </div>
                      )}

                      {movement.due_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Vence: {new Date(movement.due_date).toLocaleDateString('es-CL')}
                          </span>
                          {new Date(movement.due_date) < new Date() && movement.status !== 'paid' && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => handleDelete(e, movement.id)}
                      disabled={deletingId === movement.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar movimiento"
                    >
                      {deletingId === movement.id ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
            No se encontraron movimientos
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">
            No hay registros que coincidan con los criterios de búsqueda o filtrado actuales.
          </p>
        </div>
      )}
    </div>
  )
}
