'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@calmar/ui'
import { 
  Building2, CheckCircle, Clock, XCircle, 
  ShieldCheck, Edit3, Key, Ban, Power, 
  Phone, Mail, User, Fingerprint
} from 'lucide-react'
import { rejectB2BClient, toggleB2BClientStatus } from './actions'
import { toast } from 'sonner'
import { ApproveModal } from './approve-modal'
import { EditModal } from './edit-modal'
import { ApiKeysModal } from './api-keys-modal'
import { OrdersSection } from './orders-section'

interface B2BClient {
  id: string
  user_id: string | null
  company_name: string
  tax_id: string
  contact_name: string
  contact_email: string
  contact_phone: string
  discount_percentage: number
  credit_limit: number
  payment_terms_days: number
  is_active: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface B2BClientCardProps {
  client: B2BClient
  onUpdate: () => void
}

export function B2BClientCard({ client, onUpdate }: B2BClientCardProps) {
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showApiKeysModal, setShowApiKeysModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleReject = async () => {
    if (!confirm(`¿Estás seguro de que quieres rechazar la solicitud de ${client.company_name}?`)) return
    
    setIsProcessing(true)
    try {
      await rejectB2BClient(client.id)
      toast.success('Solicitud rechazada')
      onUpdate()
    } catch (error) {
      toast.error('Error al rechazar la solicitud')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsProcessing(true)
    try {
      await toggleB2BClientStatus(client.id, client.is_active)
      toast.success(client.is_active ? 'Cliente desactivado' : 'Cliente activado')
      onUpdate()
    } catch (error) {
      toast.error('Error al cambiar el estado')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusConfig = () => {
    switch (client.status) {
      case 'approved':
        return {
          color: client.is_active ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-400',
          icon: <CheckCircle className="h-4 w-4" />,
          label: client.is_active ? 'Activo' : 'Desactivado'
        }
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-900',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Rechazado'
        }
      default:
        return {
          color: 'bg-amber-50 text-amber-900',
          icon: <Clock className="h-4 w-4" />,
          label: 'Pendiente'
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <>
      <Card className="overflow-hidden border-none shadow-lg bg-white group transition-all hover:shadow-xl">
        <CardHeader className={`${statusConfig.color} py-4 px-6 flex flex-row items-center justify-between transition-colors`}>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5" />
            <CardTitle className="text-lg font-black uppercase tracking-tight">{client.company_name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            {statusConfig.icon} {statusConfig.label}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Información de Contacto</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-slate-400" />
                  <span className="font-bold text-slate-900">{client.contact_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-500">{client.contact_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-500">{client.contact_phone}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificación</p>
              <div className="flex items-center gap-2 text-sm">
                <Fingerprint className="h-3 w-3 text-slate-400" />
                <span className="font-bold text-slate-900">{client.tax_id}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Postulado: {new Date(client.created_at).toLocaleDateString()}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comercial</p>
              <div className="space-y-1">
                <p className="text-2xl font-black text-calmar-ocean">{client.discount_percentage}% <span className="text-[10px] text-slate-400 uppercase">Desc.</span></p>
                <p className="text-sm font-bold text-slate-900">Plazo: {client.payment_terms_days} días</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financiero</p>
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-900">${Number(client.credit_limit).toLocaleString('es-CL')}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Línea de Crédito</p>
              </div>
            </div>
          </div>

          <OrdersSection userId={client.user_id} />

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            {client.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  disabled={isProcessing}
                  onClick={handleReject}
                  className="text-[10px] font-bold uppercase tracking-widest h-10 px-6 hover:bg-red-50 hover:text-red-600 hover:border-red-200 gap-2"
                >
                  <Ban className="h-4 w-4" /> Rechazar
                </Button>
                <Button 
                  disabled={isProcessing}
                  onClick={() => setShowApproveModal(true)}
                  className="bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest h-10 px-8 gap-2 shadow-lg"
                >
                  <ShieldCheck className="h-4 w-4" /> Aprobar Cliente
                </Button>
              </>
            )}

            {client.status === 'approved' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowApiKeysModal(true)}
                  className="text-[10px] font-bold uppercase tracking-widest h-10 px-4 gap-2"
                >
                  <Key className="h-4 w-4" /> API Keys
                </Button>
                <Button 
                  variant="outline" 
                  disabled={isProcessing}
                  onClick={handleToggleStatus}
                  className={`text-[10px] font-bold uppercase tracking-widest h-10 px-4 gap-2 ${client.is_active ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}
                >
                  {client.is_active ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  {client.is_active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button 
                  onClick={() => setShowEditModal(true)}
                  className="bg-slate-900 hover:bg-calmar-ocean text-white text-[10px] font-bold uppercase tracking-widest h-10 px-8 gap-2 shadow-lg"
                >
                  <Edit3 className="h-4 w-4" /> Editar Condiciones
                </Button>
              </>
            )}

            {client.status === 'rejected' && (
              <Button 
                variant="outline" 
                onClick={() => setShowApproveModal(true)}
                className="text-[10px] font-bold uppercase tracking-widest h-10 px-6 gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Reconsiderar y Aprobar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ApproveModal 
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        clientId={client.id}
        companyName={client.company_name}
        onSuccess={onUpdate}
      />

      <EditModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={client}
        onSuccess={onUpdate}
      />

      <ApiKeysModal 
        isOpen={showApiKeysModal}
        onClose={() => setShowApiKeysModal(false)}
        clientId={client.id}
        companyName={client.company_name}
      />
    </>
  )
}
