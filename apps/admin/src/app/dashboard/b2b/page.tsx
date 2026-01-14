'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Search, Filter } from 'lucide-react'
import { B2BClientCard } from './b2b-client-card'
import { Input, Button } from '@calmar/ui'

export default function AdminB2BPage() {
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const loadClients = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('b2b_clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading clients:', error)
    } else {
      setClients(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadClients()
  }, [filterStatus])

  const filteredClients = clients.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Gestión <span className="text-calmar-ocean">B2B</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Administra solicitudes de empresas, límites de crédito y acceso API.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por empresa, RUT o contacto..." 
            className="pl-10 h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filterStatus === status 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'all' ? 'Todos' : 
               status === 'pending' ? 'Pendientes' : 
               status === 'approved' ? 'Aprobados' : 'Rechazados'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Clientes...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <B2BClientCard 
              key={client.id} 
              client={client} 
              onUpdate={loadClients} 
            />
          ))
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">No se encontraron clientes</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">No hay registros que coincidan con los criterios de búsqueda o filtrado actuales.</p>
          </div>
        )}
      </div>
    </div>
  )
}
