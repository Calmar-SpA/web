'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { Search, Plus, Building2, User, Mail, Phone, LayoutGrid, List, Trash2 } from 'lucide-react'
import { Input } from '@calmar/ui'
import Link from 'next/link'
import { activateProspect, updateProspectStage, deleteProspect } from '../actions'
import { toast } from 'sonner'
import { CompleteDataModal, getMissingProspectFields, ProspectForCompletion } from './complete-data-modal'

const STAGES = [
  { id: 'contact', label: 'Contacto', color: 'bg-slate-100' },
  { id: 'interested', label: 'Interesado', color: 'bg-blue-100' },
  { id: 'sample_sent', label: 'Muestra Enviada', color: 'bg-purple-100' },
  { id: 'negotiation', label: 'Negociación', color: 'bg-yellow-100' },
  { id: 'converted', label: 'Activo', color: 'bg-green-100' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-100' }
]

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'b2b' | 'b2c'>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [draggedProspect, setDraggedProspect] = useState<string | null>(null)
  const [ordersByProspect, setOrdersByProspect] = useState<Record<string, { count: number; lastDate?: string; total: number }>>({})
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<ProspectForCompletion | null>(null)
  const [pendingStage, setPendingStage] = useState<string | null>(null)

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
    const prospect = prospects.find(p => p.id === draggedProspect)

    try {
      if (targetStage === 'converted' && prospect) {
        const missingFields = getMissingProspectFields(prospect)
        if (missingFields.length > 0) {
          setSelectedProspect(prospect)
          setPendingStage(targetStage)
          setShowCompleteModal(true)
          return
        }
        await activateProspect(draggedProspect)
      } else {
        await updateProspectStage(draggedProspect, targetStage)
      }
      await loadProspects()
      toast.success('Etapa actualizada')
    } catch (error: any) {
      console.error('Error updating stage:', error)
      toast.error('Error al actualizar etapa')
    } finally {
      setDraggedProspect(null)
    }
  }

  const handleDelete = async (prospectId: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al prospecto "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await deleteProspect(prospectId)
      await loadProspects()
      toast.success('Prospecto eliminado correctamente')
    } catch (error: any) {
      console.error('Error deleting prospect:', error)
      toast.error('Error al eliminar el prospecto. Es posible que tenga pedidos o actividad asociada.')
    }
  }

  const filteredProspects = prospects.filter(p => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        p.fantasy_name?.toLowerCase().includes(search) ||
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

        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-calmar-ocean shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vista Kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white text-calmar-ocean shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vista de Lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board / List View */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Prospectos...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-6 min-h-[600px] -mx-4 px-4 md:mx-0 md:px-0">
          {prospectsByStage.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col min-w-[320px] max-w-[320px] flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`${stage.color} p-4 rounded-t-2xl border-2 border-slate-200 shadow-sm`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    {stage.label}
                  </h3>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-600">
                    {stage.prospects.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-50/50 border-2 border-t-0 border-slate-200 rounded-b-2xl p-3 space-y-4 min-h-[500px]">
                {stage.prospects.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onDragStart={handleDragStart}
                    isDragging={draggedProspect === prospect.id}
                    orderSummary={ordersByProspect[prospect.id]}
                    onDelete={() => handleDelete(prospect.id, prospect.contact_name)}
                  />
                ))}
                {stage.prospects.length === 0 && (
                  <div className="text-center py-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-slate-200 rounded-xl">
                    Sin prospectos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Prospecto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Última Actividad</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/crm/prospects/${prospect.id}`} className="block">
                        <div className="font-black text-sm text-slate-900 group-hover:text-calmar-ocean transition-colors">
                          {prospect.fantasy_name || prospect.contact_name}
                        </div>
                        {prospect.company_name && (
                          <div className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {prospect.company_name}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        STAGES.find(s => s.id === prospect.stage)?.color || 'bg-slate-100'
                      } border border-black/5`}>
                        {STAGES.find(s => s.id === prospect.stage)?.label || prospect.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {prospect.email}
                        </div>
                        {prospect.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {prospect.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        prospect.type === 'b2b' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {prospect.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold">
                        {ordersByProspect[prospect.id]?.lastDate 
                          ? new Date(ordersByProspect[prospect.id].lastDate!).toLocaleDateString('es-CL')
                          : 'Sin actividad'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/crm/prospects/${prospect.id}`}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-calmar-ocean transition-colors"
                        >
                          Ver Detalle
                        </Link>
                        <button
                          onClick={() => handleDelete(prospect.id, prospect.contact_name)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar Prospecto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProspects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron prospectos</p>
            </div>
          )}
        </div>
      )}

      <CompleteDataModal
        prospect={selectedProspect}
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false)
          setSelectedProspect(null)
          setPendingStage(null)
        }}
        onSuccess={async () => {
          if (pendingStage === 'converted' && selectedProspect) {
            try {
              await activateProspect(selectedProspect.id)
              await loadProspects()
              toast.success('Prospecto activado')
            } catch (error: any) {
              console.error('Error updating stage:', error)
              toast.error('Error al activar prospecto')
            } finally {
              setPendingStage(null)
            }
          }
        }}
      />
    </div>
  )
}

function ProspectCard({ 
  prospect, 
  onDragStart, 
  isDragging,
  orderSummary,
  onDelete
}: { 
  prospect: any
  onDragStart: (e: React.DragEvent, id: string) => void
  isDragging: boolean
  orderSummary?: { count: number; lastDate?: string; total: number }
  onDelete: () => void
}) {
  return (
    <div className="relative group/card">
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
                {prospect.fantasy_name || prospect.contact_name}
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
            <p className="text-xs text-slate-500 mt-3 line-clamp-2 pr-8">
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
      
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete()
        }}
        className="absolute bottom-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-10"
        title="Eliminar Prospecto"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
