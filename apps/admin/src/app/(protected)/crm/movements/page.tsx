'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { Search, Plus, Package, DollarSign, Calendar, AlertCircle, CheckCircle, UserX, Trash2, FileText, Building2, CreditCard, Phone, User, Truck } from 'lucide-react'
import { deleteMovement } from '../actions'
import { Input, Button } from '@calmar/ui'
import Link from 'next/link'
import { toast } from 'sonner'

const MOVEMENT_TYPES = {
  sample: { label: 'Muestra', color: 'bg-purple-100 text-purple-700' },
  consignment: { label: 'Consignación', color: 'bg-indigo-100 text-indigo-700' },
  sale_invoice: { label: 'Venta Factura', color: 'bg-green-100 text-green-700' },
  sale_credit: { label: 'Venta Crédito', color: 'bg-orange-100 text-orange-700' },
  sale_boleta: { label: 'Venta Boleta', color: 'bg-teal-100 text-teal-700' }
}

const STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Entregado', color: 'bg-blue-100 text-blue-700' },
  returned: { label: 'Devuelto', color: 'bg-gray-100 text-gray-700' },
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
  const [filterPrice, setFilterPrice] = useState<string>('all')
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [filterDocs, setFilterDocs] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const docCounts = useMemo(() => {
    let noInvoice = 0, noBoleta = 0, noDispatch = 0
    for (const m of movements) {
      const isB2B = m.prospect?.type === 'b2b' || 
                    m.movement_type === 'sale_invoice' || 
                    m.movement_type === 'sale_credit'
      const hasInvoice = m.invoice_url || m.invoice_date
      const hasDispatch = m.dispatch_order_url || m.dispatch_order_date
      
      if (m.movement_type !== 'sample') {
         if (isB2B && !hasInvoice) noInvoice++
         if (!isB2B && !hasInvoice) noBoleta++
      }
      if (isB2B && !hasDispatch) noDispatch++
    }
    return { noInvoice, noBoleta, noDispatch }
  }, [movements])

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
    // Price Filter
    if (filterPrice === 'free') {
      if (m.movement_type !== 'sample' && Number(m.total_amount) > 0) return false
    } else if (filterPrice === 'paid') {
      if (m.movement_type === 'sample' || Number(m.total_amount) <= 0) return false
    } else     if (filterPrice === 'range') {
      const amount = Number(m.total_amount)
      if (priceMin && amount < Number(priceMin)) return false
      if (priceMax && amount > Number(priceMax)) return false
    }

    // Document Filter
    if (filterDocs !== 'all') {
      const isB2B = m.prospect?.type === 'b2b' || 
                    m.movement_type === 'sale_invoice' || 
                    m.movement_type === 'sale_credit'
      const hasInvoice = m.invoice_url || m.invoice_date
      const hasDispatch = m.dispatch_order_url || m.dispatch_order_date

      if (filterDocs === 'no_invoice') {
        // B2B sin factura (excluir muestras)
        if (m.movement_type === 'sample') return false
        if (!isB2B) return false
        if (hasInvoice) return false
      } else if (filterDocs === 'no_boleta') {
        // B2C/boleta sin boleta (excluir muestras)
        if (m.movement_type === 'sample') return false
        if (isB2B) return false
        if (hasInvoice) return false
      } else if (filterDocs === 'no_dispatch') {
        // B2B sin guia de despacho
        if (!isB2B) return false
        if (hasDispatch) return false
      }
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        m.movement_number?.toLowerCase().includes(search) ||
        m.prospect?.fantasy_name?.toLowerCase().includes(search) ||
        m.prospect?.contact_name?.toLowerCase().includes(search) ||
        m.prospect?.company_name?.toLowerCase().includes(search) ||
        m.prospect?.tax_id?.toLowerCase().includes(search) ||
        m.b2b_client?.company_name?.toLowerCase().includes(search) ||
        m.customer?.email?.toLowerCase().includes(search) ||
        m.sample_recipient_name?.toLowerCase().includes(search) ||
        m.sample_event_context?.toLowerCase().includes(search) ||
        m.boleta_buyer_name?.toLowerCase().includes(search)
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

          {/* Price Filter */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterPrice('all')
                  setPriceMin('')
                  setPriceMax('')
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterPrice === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                Todos
              </button>
              <button
                onClick={() => {
                  setFilterPrice('free')
                  setPriceMin('')
                  setPriceMax('')
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filterPrice === 'free'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Gratis
              </button>
              <button
                onClick={() => {
                  setFilterPrice('paid')
                  setPriceMin('')
                  setPriceMax('')
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filterPrice === 'paid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Con Precio
              </button>
              <button
                onClick={() => setFilterPrice('range')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filterPrice === 'range'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Rango
              </button>
            </div>
            
            {filterPrice === 'range' && (
              <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-20 h-8 text-xs border-slate-200 bg-white"
                  min="0"
                />
                <span className="text-slate-400 text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-20 h-8 text-xs border-slate-200 bg-white"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Document Filter */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterDocs('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterDocs === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3 h-3" />
                Todos
              </button>
              <button
                onClick={() => setFilterDocs('no_invoice')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterDocs === 'no_invoice'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sin Factura
                {docCounts.noInvoice > 0 && (
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">
                    {docCounts.noInvoice}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterDocs('no_boleta')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterDocs === 'no_boleta'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sin Boleta
                {docCounts.noBoleta > 0 && (
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">
                    {docCounts.noBoleta}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterDocs('no_dispatch')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterDocs === 'no_dispatch'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sin Guía
                {docCounts.noDispatch > 0 && (
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">
                    {docCounts.noDispatch}
                  </span>
                )}
              </button>
            </div>
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
            
            // Get last approved payment date
            const lastApprovedPayment = movement.payments
              ?.filter((p: any) => p.verification_status === 'approved')
              .sort((a: any, b: any) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())[0]
            const lastPaymentDate = lastApprovedPayment?.paid_at
            
            const isMovementB2B = movement.prospect?.type === 'b2b' || 
                                  movement.movement_type === 'sale_invoice' || 
                                  movement.movement_type === 'sale_credit'

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
                        <div className="flex flex-col gap-1">
                          {movement.prospect.fantasy_name && (
                            <span className="flex items-center gap-1 font-bold text-slate-700">
                              <Building2 className="w-4 h-4 text-calmar-ocean" />
                              {movement.prospect.fantasy_name}
                            </span>
                          )}
                          {movement.prospect.company_name && movement.prospect.company_name !== movement.prospect.fantasy_name && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Package className="w-3 h-3" />
                              {movement.prospect.company_name}
                            </span>
                          )}
                          {movement.prospect.tax_id && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <CreditCard className="w-3 h-3" />
                              {movement.prospect.tax_id}
                            </span>
                          )}
                          {(movement.prospect.contact_name || movement.prospect.phone) && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <User className="w-3 h-3" />
                              {[movement.prospect.contact_name, movement.prospect.phone].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
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
                      
                      {/* Anonymous boleta buyer */}
                      {movement.movement_type === 'sale_boleta' && 
                       !movement.prospect && 
                       !movement.b2b_client && 
                       !movement.customer && 
                       movement.boleta_buyer_name && (
                        <span className="flex items-center gap-1 text-teal-600">
                          <UserX className="w-4 h-4" />
                          {movement.boleta_buyer_name}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                          Total
                        </p>
                        <p className={`text-2xl font-black ${movement.movement_type === 'sample' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {movement.movement_type === 'sample' ? 'GRATIS' : `$${Number(movement.total_amount).toLocaleString('es-CL')}`}
                        </p>
                      </div>

                      {/* Indicators */}
                      <div className="flex flex-col items-end gap-2">
                        {/* Payment Status */}
                        {movement.movement_type !== 'sample' && (
                          <div className="flex items-center gap-2">
                            {movement.status === 'paid' ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <CheckCircle className="w-3 h-3" />
                                Pagado {lastPaymentDate && `(${new Date(lastPaymentDate).toLocaleDateString('es-CL')})`}
                              </span>
                            ) : movement.status === 'partial_paid' ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                <AlertCircle className="w-3 h-3" />
                                Parcial {lastPaymentDate && `(${new Date(lastPaymentDate).toLocaleDateString('es-CL')})`}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                <AlertCircle className="w-3 h-3" />
                                Pendiente ${remainingBalance.toLocaleString('es-CL')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Invoice Status */}
                        <div className="flex items-center gap-2">
                          {movement.invoice_url || movement.invoice_date ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              <FileText className="w-3 h-3" />
                              {isMovementB2B ? 'Facturado' : 'Con Boleta'} {movement.invoice_date && `(${new Date(movement.invoice_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })})`}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                              <FileText className="w-3 h-3" />
                              {isMovementB2B ? 'Sin Factura' : 'Sin Boleta'}
                            </span>
                          )}
                        </div>

                        {/* Dispatch Status */}
                        {isMovementB2B && (
                          <div className="flex items-center gap-2">
                            {movement.dispatch_order_url || movement.dispatch_order_date ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <Truck className="w-3 h-3" />
                                Guía {movement.dispatch_order_date && `(${new Date(movement.dispatch_order_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })})`}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                <Truck className="w-3 h-3" />
                                Sin Guía
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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
