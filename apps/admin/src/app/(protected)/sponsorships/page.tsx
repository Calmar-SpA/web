'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Mail, Phone, ExternalLink, Trash2, Filter } from 'lucide-react'
import { Input } from '@calmar/ui'
import Link from 'next/link'
import { updateSponsorshipStatus, deleteSponsorshipRequest } from './actions'
import { toast } from 'sonner'

const APPLICANT_TYPE_LABELS: Record<string, string> = {
  evento: 'Evento',
  deportista: 'Deportista',
  organizacion: 'Organización',
  influencer: 'Influencer',
  otro: 'Otro',
}

const SPONSORSHIP_TYPE_LABELS: Record<string, string> = {
  canje: 'Canje',
  monetario: 'Monetario',
  mixto: 'Mixto',
  otro: 'Otro',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: 'En Revisión', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
}

export default function SponsorshipsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const loadRequests = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      let query = supabase
        .from('sponsorship_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        query = query.eq('applicant_type', filterType)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      console.error('Error loading sponsorship requests:', error)
      toast.error('Error al cargar solicitudes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [filterStatus, filterType])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateSponsorshipStatus(id, newStatus)
      await loadRequests()
      toast.success('Estado actualizado')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la solicitud de "${name}"?`)) {
      return
    }

    try {
      await deleteSponsorshipRequest(id)
      await loadRequests()
      toast.success('Solicitud eliminada')
    } catch (error: any) {
      console.error('Error deleting request:', error)
      toast.error('Error al eliminar solicitud')
    }
  }

  const filteredRequests = requests.filter(req => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        req.name?.toLowerCase().includes(search) ||
        req.contact_name?.toLowerCase().includes(search) ||
        req.email?.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Solicitudes de <span className="text-calmar-ocean">Patrocinio</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Gestiona las solicitudes de colaboración y auspicio
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, contacto, email..."
            className="pl-10 h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-calmar-ocean/20"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-calmar-ocean/20"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(APPLICANT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando solicitudes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitante</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Modalidad</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/sponsorships/${request.id}`} className="block">
                        <div className="font-black text-sm text-slate-900 group-hover:text-calmar-ocean transition-colors">
                          {request.name}
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-0.5">
                          {request.contact_name}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                        {APPLICANT_TYPE_LABELS[request.applicant_type] || request.applicant_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {request.email}
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {request.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">
                        {SPONSORSHIP_TYPE_LABELS[request.sponsorship_type] || request.sponsorship_type}
                      </span>
                      {request.budget_requested && (
                        <div className="text-xs text-slate-500 mt-1">
                          ${request.budget_requested.toLocaleString('es-CL')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border-0 cursor-pointer ${
                          STATUS_CONFIG[request.status]?.color || 'bg-slate-100 text-slate-700'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold">
                        {new Date(request.created_at).toLocaleDateString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/sponsorships/${request.id}`}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-calmar-ocean transition-colors"
                        >
                          Ver Detalle
                        </Link>
                        <button
                          onClick={() => handleDelete(request.id, request.name)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
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
          {filteredRequests.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                No se encontraron solicitudes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
