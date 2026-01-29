'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Phone, Instagram, Youtube, ExternalLink, Calendar, User, Building2, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@calmar/ui'
import { updateSponsorshipStatus, updateSponsorshipNotes } from '../actions'
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
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  reviewing: { label: 'En Revisión', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function SponsorshipDetailPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadRequest()
  }, [params.id])

  const loadRequest = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setRequest(data)
      setAdminNotes(data.admin_notes || '')
    } catch (error: any) {
      console.error('Error loading sponsorship request:', error)
      toast.error('Error al cargar solicitud')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateSponsorshipStatus(params.id, newStatus)
      await loadRequest()
      toast.success('Estado actualizado')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handleSaveNotes = async () => {
    setIsSaving(true)
    try {
      await updateSponsorshipNotes(params.id, adminNotes)
      await loadRequest()
      toast.success('Notas guardadas')
    } catch (error: any) {
      console.error('Error saving notes:', error)
      toast.error('Error al guardar notas')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Solicitud no encontrada</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/sponsorships" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
            {request.name}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {APPLICANT_TYPE_LABELS[request.applicant_type] || request.applicant_type}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={request.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border-2 cursor-pointer ${
              STATUS_CONFIG[request.status]?.color || 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Persona de Contacto
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {request.contact_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Email
                    </p>
                    <a 
                      href={`mailto:${request.email}`}
                      className="text-sm font-bold text-calmar-ocean hover:underline mt-1 block"
                    >
                      {request.email}
                    </a>
                  </div>
                </div>

                {request.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Teléfono
                      </p>
                      <a 
                        href={`tel:${request.phone}`}
                        className="text-sm font-bold text-calmar-ocean hover:underline mt-1 block"
                      >
                        {request.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Fecha de Solicitud
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {new Date(request.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          {(request.social_instagram || request.social_tiktok || request.social_youtube || request.social_other) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tight">
                  Redes Sociales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.social_instagram && (
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-slate-400" />
                    <a 
                      href={`https://instagram.com/${request.social_instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-calmar-ocean hover:underline flex items-center gap-1"
                    >
                      {request.social_instagram}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {request.social_tiktok && (
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                    <a 
                      href={`https://tiktok.com/@${request.social_tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-calmar-ocean hover:underline flex items-center gap-1"
                    >
                      {request.social_tiktok}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {request.social_youtube && (
                  <div className="flex items-center gap-3">
                    <Youtube className="h-5 w-5 text-slate-400" />
                    <a 
                      href={request.social_youtube.startsWith('http') ? request.social_youtube : `https://youtube.com/${request.social_youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-calmar-ocean hover:underline flex items-center gap-1"
                    >
                      {request.social_youtube}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {request.social_other && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Otras redes
                      </p>
                      <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">
                        {request.social_other}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Proposal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                Propuesta de Colaboración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {request.proposal}
              </p>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                Notas Internas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
                placeholder="Añadir notas sobre esta solicitud..."
                className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-calmar-ocean/20 transition-all resize-none text-sm"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="bg-slate-900 text-white font-bold"
              >
                {isSaving ? 'Guardando...' : 'Guardar Notas'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                Detalles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Modalidad de Auspicio
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {SPONSORSHIP_TYPE_LABELS[request.sponsorship_type] || request.sponsorship_type}
                </p>
              </div>

              {request.budget_requested && (
                <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                  <DollarSign className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Presupuesto Solicitado
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      ${request.budget_requested.toLocaleString('es-CL')} CLP
                    </p>
                  </div>
                </div>
              )}

              {request.audience_size && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Alcance Estimado
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {request.audience_size}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => handleStatusChange('reviewing')}
                disabled={request.status === 'reviewing'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Marcar en Revisión
              </Button>
              <Button
                onClick={() => handleStatusChange('approved')}
                disabled={request.status === 'approved'}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                Aprobar
              </Button>
              <Button
                onClick={() => handleStatusChange('rejected')}
                disabled={request.status === 'rejected'}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Rechazar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
