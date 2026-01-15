'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { ArrowLeft, Mail, Phone, Building2, Plus, Package, DollarSign, Calendar, User } from 'lucide-react'
import { Button, Input } from '@calmar/ui'
import Link from 'next/link'
import { createInteraction, updateProspectStage } from '../../actions'
import { toast } from 'sonner'

const STAGES = [
  { id: 'contact', label: 'Contacto' },
  { id: 'interested', label: 'Interesado' },
  { id: 'sample_sent', label: 'Muestra Enviada' },
  { id: 'negotiation', label: 'Negociación' },
  { id: 'converted', label: 'Convertido' },
  { id: 'lost', label: 'Perdido' }
]

export default function ProspectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prospectId = params.id as string
  
  const [prospect, setProspect] = useState<any>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [interactionForm, setInteractionForm] = useState({
    interaction_type: 'note' as 'call' | 'email' | 'meeting' | 'note' | 'sample_sent' | 'quote_sent' | 'other',
    subject: '',
    notes: ''
  })

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      const prospectData = await crmService.getProspectById(prospectId)
      setProspect(prospectData)
    } catch (error: any) {
      console.error('Error loading prospect:', error)
      toast.error('Error al cargar el prospecto')
      setIsLoading(false)
      return
    }

    try {
      const [interactionsData, movementsData, ordersData] = await Promise.all([
        crmService.getProspectInteractions(prospectId),
        crmService.getMovements({ prospect_id: prospectId }),
        crmService.getProspectOrders(prospectId)
      ])
      
      setInteractions(interactionsData || [])
      setMovements(movementsData || [])
      setOrders(ordersData || [])
    } catch (error: any) {
      console.error('Error loading related data:', error)
      toast.error('Algunos datos no se pudieron cargar')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (prospectId) {
      loadData()
    }
  }, [prospectId])

  const handleStageChange = async (newStage: string) => {
    try {
      await updateProspectStage(prospectId, newStage)
      await loadData()
      toast.success('Etapa actualizada')
    } catch (error: any) {
      console.error('Error updating stage:', error)
      toast.error('Error al actualizar etapa')
    }
  }

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createInteraction({
        prospect_id: prospectId,
        ...interactionForm
      })
      
      toast.success('Interacción registrada')
      setShowInteractionForm(false)
      setInteractionForm({
        interaction_type: 'note',
        subject: '',
        notes: ''
      })
      await loadData()
    } catch (error: any) {
      console.error('Error creating interaction:', error)
      toast.error('Error al registrar interacción')
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

  if (!prospect) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Prospecto no encontrado</p>
        <Link href="/crm/prospects">
          <Button>Volver a Prospectos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/prospects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            {prospect.contact_name}
          </h1>
          {prospect.company_name && (
            <p className="text-slate-500 mt-1 font-medium">{prospect.company_name}</p>
          )}
        </div>
        <div className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider ${
          prospect.type === 'b2b' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {prospect.type}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Información de Contacto</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">{prospect.email}</span>
              </div>
              {prospect.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">{prospect.phone}</span>
                </div>
              )}
              {prospect.tax_id && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">RUT: {prospect.tax_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stage Selector */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Etapa Actual</h2>
            <select
              value={prospect.stage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none font-bold uppercase tracking-wider text-sm"
            >
              {STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          {prospect.notes && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Notas</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prospect.notes}</p>
            </div>
          )}

          {/* Interactions */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black uppercase tracking-tight">Interacciones</h2>
              <Button
                size="sm"
                onClick={() => setShowInteractionForm(!showInteractionForm)}
                className="uppercase font-black tracking-wider"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva
              </Button>
            </div>

            {showInteractionForm && (
              <form onSubmit={handleAddInteraction} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={interactionForm.interaction_type}
                    onChange={(e) => setInteractionForm({ ...interactionForm, interaction_type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                  >
                    <option value="call">Llamada</option>
                    <option value="email">Email</option>
                    <option value="meeting">Reunión</option>
                    <option value="note">Nota</option>
                    <option value="sample_sent">Muestra Enviada</option>
                    <option value="quote_sent">Cotización Enviada</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Asunto
                  </label>
                  <Input
                    value={interactionForm.subject}
                    onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                    placeholder="Asunto de la interacción"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Notas *
                  </label>
                  <textarea
                    required
                    value={interactionForm.notes}
                    onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                    placeholder="Detalles de la interacción..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="uppercase font-black tracking-wider"
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowInteractionForm(false)
                      setInteractionForm({ interaction_type: 'note', subject: '', notes: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {interactions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No hay interacciones registradas</p>
              ) : (
                interactions.map((interaction) => (
                  <div key={interaction.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                          {interaction.interaction_type}
                        </span>
                        {interaction.subject && (
                          <p className="text-sm font-bold text-slate-900 mt-1">{interaction.subject}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(interaction.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{interaction.notes}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Movements */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black uppercase tracking-tight">Movimientos</h2>
              <Link href={`/crm/movements/new?prospect_id=${prospectId}`}>
                <Button size="sm" className="uppercase font-black tracking-wider">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {movements.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No hay movimientos registrados</p>
              ) : (
                movements.map((movement) => (
                  <Link
                    key={movement.id}
                    href={`/crm/movements/${movement.id}`}
                    className="block p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-calmar-ocean transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                          {movement.movement_type === 'sample' ? 'Muestra' :
                           movement.movement_type === 'consignment' ? 'Consignación' :
                           movement.movement_type === 'sale_invoice' ? 'Venta Factura' : 'Venta Crédito'}
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-1">{movement.movement_number}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-black uppercase tracking-wider ${
                        movement.status === 'paid' ? 'bg-green-100 text-green-700' :
                        movement.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {movement.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${Number(movement.total_amount).toLocaleString('es-CL')}
                      </span>
                      {movement.delivery_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(movement.delivery_date).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Web Orders */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black uppercase tracking-tight">Compras Web</h2>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No hay compras registradas</p>
              ) : (
                orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-calmar-ocean transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                          Pedido {order.order_number}
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          ${Number(order.total_amount).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>{order.status}</span>
                      <span>•</span>
                      <span>{order.order_items?.length || 0} productos</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Total Movimientos
                </p>
                <p className="text-2xl font-black text-slate-900">{movements.length}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Compras Web
                </p>
                <p className="text-2xl font-black text-slate-900">{orders.length}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Total Interacciones
                </p>
                <p className="text-2xl font-black text-slate-900">{interactions.length}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Fecha de Registro
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(prospect.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
