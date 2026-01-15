'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { Search, Plus, Building2, User, Mail, Phone } from 'lucide-react'
import { Input } from '@calmar/ui'
import Link from 'next/link'
import { updateProspectStage } from '../actions'
import { toast } from 'sonner'

const STAGES = [
  { id: 'contact', label: 'Contacto', color: 'bg-slate-100' },
  { id: 'interested', label: 'Interesado', color: 'bg-blue-100' },
  { id: 'sample_sent', label: 'Muestra Enviada', color: 'bg-purple-100' },
  { id: 'negotiation', label: 'Negociación', color: 'bg-yellow-100' },
  { id: 'converted', label: 'Convertido', color: 'bg-green-100' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-100' }
]

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'b2b' | 'b2c'>('all')
  const [draggedProspect, setDraggedProspect] = useState<string | null>(null)
  const [ordersByProspect, setOrdersByProspect] = useState<Record<string, { count: number; lastDate?: string; total: number }>>({})

  const loadProspects = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      const filters: any = {}
      if (filterType !== 'all') {
        filters.type = filterType
      }
      if (searchTerm) {
        filters.search = searchTerm
      }
      
      const data = await crmService.getProspects(filters)
      setProspects(data || [])

      if (data && data.length > 0) {
        const prospectIds = data.map((p: any) => p.id)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, prospect_id, created_at, total_amount')
          .in('prospect_id', prospectIds)

        if (ordersError) {
          console.error('Error loading prospect orders:', ordersError)
        } else {
          const summary: Record<string, { count: number; lastDate?: string; total: number }> = {}
          ordersData?.forEach((order: any) => {
            if (!order.prospect_id) return
            if (!summary[order.prospect_id]) {
              summary[order.prospect_id] = { count: 0, lastDate: order.created_at, total: 0 }
            }
            summary[order.prospect_id].count += 1
            summary[order.prospect_id].total += Number(order.total_amount || 0)
            if (
              order.created_at &&
              (!summary[order.prospect_id].lastDate ||
                new Date(order.created_at) > new Date(summary[order.prospect_id].lastDate!))
            ) {
              summary[order.prospect_id].lastDate = order.created_at
            }
          })
          setOrdersByProspect(summary)
        }
      } else {
        setOrdersByProspect({})
      }
    } catch (error: any) {
      console.error('Error loading prospects:', error)
      toast.error('Error al cargar prospectos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProspects()
  }, [filterType])

  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    setDraggedProspect(prospectId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    
    if (!draggedProspect) return

    try {
      await updateProspectStage(draggedProspect, targetStage)
      await loadProspects()
      toast.success('Etapa actualizada')
    } catch (error: any) {
      console.error('Error updating stage:', error)
      toast.error('Error al actualizar etapa')
    } finally {
      setDraggedProspect(null)
    }
  }

  const filteredProspects = prospects.filter(p => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        p.contact_name?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) ||
        p.company_name?.toLowerCase().includes(search) ||
        p.phone?.toLowerCase().includes(search) ||
        p.tax_id?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const prospectsByStage = STAGES.map(stage => ({
    ...stage,
    prospects: filteredProspects.filter(p => p.stage === stage.id)
  }))

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Pipeline de <span className="text-calmar-ocean">Prospectos</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Arrastra las tarjetas entre columnas para cambiar la etapa
          </p>
        </div>
        <Link
          href="/crm/prospects/new"
          className="inline-flex items-center justify-center gap-2 bg-calmar-ocean text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-calmar-ocean/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Prospecto
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, email, empresa..."
            className="pl-10 h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link
          href="/crm/prospects/new"
          className="inline-flex items-center justify-center gap-2 bg-calmar-primary text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-calmar-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Prospecto
        </Link>
        
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {(['all', 'b2b', 'b2c'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filterType === type
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === 'all' ? 'Todos' : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Prospectos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {prospectsByStage.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`${stage.color} p-4 rounded-t-xl border-2 border-slate-200`}>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  {stage.label}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-bold">
                  {stage.prospects.length} prospectos
                </p>
              </div>
              
              <div className="flex-1 bg-slate-50 border-2 border-t-0 border-slate-200 rounded-b-xl p-3 space-y-3 min-h-[400px]">
                {stage.prospects.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onDragStart={handleDragStart}
                    isDragging={draggedProspect === prospect.id}
                    orderSummary={ordersByProspect[prospect.id]}
                  />
                ))}
                {stage.prospects.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Sin prospectos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProspectCard({ 
  prospect, 
  onDragStart, 
  isDragging,
  orderSummary
}: { 
  prospect: any
  onDragStart: (e: React.DragEvent, id: string) => void
  isDragging: boolean
  orderSummary?: { count: number; lastDate?: string; total: number }
}) {
  return (
    <Link href={`/crm/prospects/${prospect.id}`}>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, prospect.id)}
        className={`
          bg-white p-4 rounded-xl border-2 border-slate-200 
          hover:border-calmar-ocean transition-all cursor-move
          shadow-sm hover:shadow-md
          ${isDragging ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-black text-sm text-slate-900 mb-1">
              {prospect.contact_name}
            </h4>
            {prospect.company_name && (
              <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                <Building2 className="w-3 h-3" />
                <span className="font-bold">{prospect.company_name}</span>
              </div>
            )}
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
            prospect.type === 'b2b' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {prospect.type}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail className="w-3 h-3" />
            <span className="truncate">{prospect.email}</span>
          </div>
          {prospect.tax_id && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-black uppercase tracking-wider text-[10px] text-slate-500">RUT</span>
              <span>{prospect.tax_id}</span>
            </div>
          )}
          {prospect.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-3 h-3" />
              <span>{prospect.phone}</span>
            </div>
          )}
        </div>

        {(orderSummary?.count || prospect.notes) && (
          <p className="text-xs text-slate-500 mt-3 line-clamp-2">
            {orderSummary?.count
              ? `Compras web: ${orderSummary.count} • Total: $${orderSummary.total.toLocaleString('es-CL')}${
                  orderSummary.lastDate
                    ? ` • Última: ${new Date(orderSummary.lastDate).toLocaleDateString('es-CL')}`
                    : ''
                }`
              : prospect.notes}
          </p>
        )}
      </div>
    </Link>
  )
}
