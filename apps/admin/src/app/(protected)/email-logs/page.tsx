'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, CardContent, Input, Badge } from "@calmar/ui"
import { 
  Mail, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Bell, 
  Check, 
  AlertTriangle,
  Eye,
  RefreshCw
} from "lucide-react"

type EmailLog = {
  id: string
  to_email: string
  to_name: string | null
  subject: string
  email_type: string
  email_category: string
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed'
  source: 'admin' | 'web'
  sent_at: string
  opened_at: string | null
  metadata: any
  has_attachment: boolean
  error_message: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Check },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  opened: { label: 'Abierto', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Eye },
  bounced: { label: 'Rebotado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
}

const TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  document: { label: 'Documento', icon: FileText },
  notification: { label: 'Notificación', icon: Bell },
  confirmation: { label: 'Confirmación', icon: CheckCircle },
  alert: { label: 'Alerta', icon: AlertTriangle },
  test: { label: 'Prueba', icon: FlaskConical },
}

function FlaskConical(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </svg>
  )
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  useEffect(() => {
    loadLogs()
  }, [filterType, filterStatus, page])

  const loadLogs = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      let query = supabase
        .from('email_logs')
        .select('*', { count: 'exact' })
        .order('sent_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (searchTerm) {
        query = query.or(`to_email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`)
      }

      if (filterType !== 'all') {
        query = query.eq('email_type', filterType)
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error, count } = await query

      if (error) throw error

      setLogs(data || [])
      setHasMore(count ? (page * pageSize) < count : false)
    } catch (error) {
      console.error('Error loading email logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadLogs()
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-950">Historial de Correos</h1>
          <p className="text-slate-700 font-medium">Registro de todos los correos enviados desde la plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => loadLogs()}
            className="border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por email o asunto..." 
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <select 
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Todos los tipos</option>
            <option value="document">Documentos</option>
            <option value="notification">Notificaciones</option>
            <option value="confirmation">Confirmaciones</option>
            <option value="alert">Alertas</option>
            <option value="test">Pruebas</option>
          </select>

          <select 
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="sent">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="opened">Abierto</option>
            <option value="bounced">Rebotado</option>
            <option value="failed">Fallido</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && logs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando historial...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 m-4">
              <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
                No hay correos registrados
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                No se encontraron correos con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Fecha</th>
                    <th className="px-6 py-4 font-bold">Destinatario</th>
                    <th className="px-6 py-4 font-bold">Asunto</th>
                    <th className="px-6 py-4 font-bold">Tipo</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => {
                    const statusInfo = STATUS_CONFIG[log.status] || STATUS_CONFIG.sent
                    const StatusIcon = statusInfo.icon
                    const typeInfo = TYPE_CONFIG[log.email_type] || { label: log.email_type, icon: Mail }
                    const TypeIcon = typeInfo.icon
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {new Date(log.sent_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.sent_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{log.to_name || 'Sin nombre'}</span>
                            <span className="text-xs text-slate-500 font-mono">{log.to_email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs truncate font-medium text-slate-700" title={log.subject}>
                            {log.subject}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                            {log.email_category}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <TypeIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">{typeInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex items-center gap-1.5 w-fit ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                          {log.opened_at && (
                            <div className="text-[10px] text-slate-400 mt-1 pl-1">
                              Abierto: {new Date(log.opened_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-calmar-ocean">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              Página {page}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="text-xs"
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || isLoading}
                className="text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
