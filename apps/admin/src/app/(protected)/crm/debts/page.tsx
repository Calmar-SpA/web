'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { DollarSign, AlertCircle, Calendar, Search, Building2, User } from 'lucide-react'
import { Input } from '@calmar/ui'
import Link from 'next/link'
import { toast } from 'sonner'

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOverdue, setFilterOverdue] = useState(false)
  const [stats, setStats] = useState({
    total_pending: 0,
    overdue_amount: 0,
    overdue_count: 0
  })

  const loadDebts = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      const filters: any = {}
      if (filterOverdue) {
        filters.overdue_only = true
      }
      
      const data = await crmService.getDebts(filters)
      setDebts(data || [])

      // Calculate stats
      const totalPending = data?.reduce((sum: number, d: any) => sum + (d.remaining_balance || 0), 0) || 0
      const overdue = data?.filter((d: any) => {
        if (!d.due_date) return false
        return new Date(d.due_date) < new Date() && d.status !== 'paid'
      }) || []
      const overdueAmount = overdue.reduce((sum: number, d: any) => sum + (d.remaining_balance || 0), 0)

      setStats({
        total_pending: totalPending,
        overdue_amount: overdueAmount,
        overdue_count: overdue.length
      })
    } catch (error: any) {
      console.error('Error loading debts:', error?.message || error)
      toast.error('Error al cargar deudas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDebts()
  }, [filterOverdue])

  const filteredDebts = debts.filter(debt => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        debt.movement_number?.toLowerCase().includes(search) ||
        debt.prospect?.fantasy_name?.toLowerCase().includes(search) ||
        debt.prospect?.contact_name?.toLowerCase().includes(search) ||
        debt.prospect?.company_name?.toLowerCase().includes(search) ||
        debt.b2b_client?.company_name?.toLowerCase().includes(search) ||
        debt.customer?.email?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const isOverdue = (debt: any) => {
    if (!debt.due_date) return false
    return new Date(debt.due_date) < new Date() && debt.status !== 'paid'
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
          Control de <span className="text-calmar-ocean">Deudas</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Seguimiento de pagos pendientes y vencimientos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Total Pendiente
          </h3>
          <p className="text-3xl font-black text-slate-900">
            ${stats.total_pending.toLocaleString('es-CL')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Vencidos
          </h3>
          <p className="text-3xl font-black text-red-600">
            {stats.overdue_count}
          </p>
          <p className="text-sm text-red-600 font-bold mt-1">
            ${stats.overdue_amount.toLocaleString('es-CL')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-100">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Monto Vencido
          </h3>
          <p className="text-3xl font-black text-orange-600">
            ${stats.overdue_amount.toLocaleString('es-CL')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por número, cliente..."
              className="pl-10 h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterOverdue(false)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                !filterOverdue
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterOverdue(true)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filterOverdue
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Solo Vencidas
            </button>
          </div>
        </div>
      </div>

      {/* Debts List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Deudas...</p>
        </div>
      ) : filteredDebts.length > 0 ? (
        <div className="space-y-4">
          {filteredDebts.map((debt) => {
            const overdue = isOverdue(debt)
            
            return (
              <Link
                key={debt.id}
                href={`/crm/movements/${debt.id}`}
                className={`block bg-white p-6 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
                  overdue
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-100 hover:border-calmar-ocean'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {debt.movement_number}
                      </h3>
                      {overdue && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Vencido
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        debt.movement_type === 'consignment' 
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {debt.movement_type === 'consignment' ? 'Consignación' : 'Venta Crédito'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {debt.prospect && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {debt.prospect.fantasy_name || debt.prospect.contact_name}
                        </span>
                      )}
                      {debt.b2b_client && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {debt.b2b_client.company_name}
                        </span>
                      )}
                      {debt.customer && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {debt.customer.email}
                        </span>
                      )}
                      {debt.due_date && (
                        <span className={`flex items-center gap-1 ${
                          overdue ? 'text-red-600 font-bold' : 'text-slate-600'
                        }`}>
                          <Calendar className="w-4 h-4" />
                          Vence: {new Date(debt.due_date).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                        Total
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        ${Number(debt.total_amount).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-wider text-green-600 mb-1">
                        Pagado
                      </p>
                      <p className="text-lg font-black text-green-600">
                        ${(debt.total_paid || 0).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <div className="text-right pt-2 border-t border-slate-200">
                      <p className={`text-xs font-black uppercase tracking-wider mb-1 ${
                        overdue ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        Pendiente
                      </p>
                      <p className={`text-xl font-black ${
                        overdue ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        ${(debt.remaining_balance || 0).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
            No se encontraron deudas
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">
            {filterOverdue 
              ? 'No hay deudas vencidas en este momento.'
              : 'No hay deudas pendientes registradas.'}
          </p>
        </div>
      )}
    </div>
  )
}
