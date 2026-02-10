'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CRMService } from '@calmar/database'
import { ArrowLeft, Mail, Phone, Building2, Plus, Package, DollarSign, Calendar, User, ShieldCheck } from 'lucide-react'
import { Button, Input, RutInput } from '@calmar/ui'
import Link from 'next/link'
import { activateProspect, createInteraction, resendActivationEmail, updateProspect, updateProspectStage, searchUsers } from '../../actions'
import { toast } from 'sonner'
import { isValidPhoneIntl, isValidRut, parsePhoneIntl } from '@calmar/utils'
import { formatClp } from '@calmar/utils'
import { ApproveB2BModal } from '../approve-b2b-modal'
import { CompleteDataModal, getMissingProspectFields } from '../complete-data-modal'
import { Search, X } from 'lucide-react'

const STAGES = [
  { id: 'contact', label: 'Contacto' },
  { id: 'interested', label: 'Interesado' },
  { id: 'sample_sent', label: 'Muestra Enviada' },
  { id: 'negotiation', label: 'Negociación' },
  { id: 'converted', label: 'Activo' },
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
  const [marketingDeliveries, setMarketingDeliveries] = useState<any[]>([])
  const [productPrices, setProductPrices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [pendingStage, setPendingStage] = useState<string | null>(null)
  const [taxIdValue, setTaxIdValue] = useState('')
  const [requestingRutValue, setRequestingRutValue] = useState('')
  const [phoneValue, setPhoneValue] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('56')
  const [userQuery, setUserQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
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
      
      if (prospectData.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('id', prospectData.user_id)
          .single()
        
        if (userData) {
          setSelectedUser(userData)
        }
      } else {
        setSelectedUser(null)
      }
    } catch (error: any) {
      console.error('Error loading prospect:', error?.message || error)
      toast.error('Error al cargar el prospecto')
      setIsLoading(false)
      return
    }

    // Cargar datos relacionados de forma independiente para que si uno falla, los otros no se pierdan
    try {
      const interactionsData = await crmService.getProspectInteractions(prospectId)
      setInteractions(interactionsData || [])
    } catch (error: any) {
      console.error('Error loading interactions:', error?.message || error)
    }

    try {
      const movementsData = await crmService.getMovements({ prospect_id: prospectId })
      setMovements(movementsData || [])
    } catch (error: any) {
      console.error('Error loading movements:', error?.message || error)
    }

    try {
      const ordersData = await crmService.getProspectOrders(prospectId)
      setOrders(ordersData || [])
    } catch (error: any) {
      console.error('Error loading orders:', error?.message || error)
    }

    try {
      const deliveriesData = await crmService.getProspectMarketingDeliveries(prospectId)
      setMarketingDeliveries(deliveriesData || [])
    } catch (error: any) {
      console.error('Error loading marketing deliveries:', error?.message || error)
    }

    try {
      const prices = await crmService.getProspectProductPrices(prospectId)
      if (prices && prices.length > 0) {
        const productIds = prices.map((p: any) => p.product_id)
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, sku, base_price')
          .in('id', productIds)
        
        if (productsData) {
          const combined = prices.map((price: any) => {
            const product = productsData.find((p: any) => p.id === price.product_id)
            return {
              productId: price.product_id,
              productName: product?.name || 'Producto desconocido',
              sku: product?.sku || '',
              basePrice: product?.base_price || 0,
              fixedPrice: price.fixed_price
            }
          })
          setProductPrices(combined)
        }
      } else {
        setProductPrices([])
      }
    } catch (error: any) {
      console.error('Error loading product prices:', error?.message || error)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (prospectId) {
      loadData()
    }
  }, [prospectId])

  useEffect(() => {
    if (prospect) {
      setTaxIdValue(prospect.tax_id || '')
      setRequestingRutValue(prospect.requesting_rut || '')
      const parsedPhone = parsePhoneIntl(prospect.phone)
      setPhoneValue(parsedPhone.digits || '')
      setPhoneCountry(parsedPhone.countryCode || '56')
    }
  }, [prospect])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (userQuery.length >= 3) {
        setIsSearching(true)
        try {
          const results = await searchUsers(userQuery)
          setSearchResults(results)
        } catch (error) {
          console.error('Error searching users:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [userQuery])

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setUserQuery('')
    setSearchResults([])
  }

  const isTaxIdValid = !taxIdValue || isValidRut(taxIdValue)
  const isRequestingRutValid = !requestingRutValue || isValidRut(requestingRutValue)
  const isPhoneValid = !phoneValue || isValidPhoneIntl(phoneValue)
  const isFormValid = isTaxIdValid && isRequestingRutValid && isPhoneValid

  const formatLocalPhone = (value: string) =>
    value.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')

  const handleStageChange = async (newStage: string) => {
    if (!prospect) return

    if (newStage === 'converted') {
      const missingFields = getMissingProspectFields(prospect)
      if (missingFields.length > 0) {
        setPendingStage(newStage)
        setShowCompleteModal(true)
        return
      }

      if (prospect.type === 'b2b' && !prospect.credit_limit) {
        setPendingStage(newStage)
        setShowApproveModal(true)
        return
      }

      try {
        await activateProspect(prospectId)
        await loadData()
        toast.success('Etapa actualizada a Activo y correo enviado')
      } catch (error: any) {
        console.error('Error updating stage:', error)
        toast.error(error.message || 'Error al actualizar etapa')
      }
      return
    }

    try {
      await updateProspectStage(prospectId, newStage)
      await loadData()
      toast.success('Etapa actualizada')
    } catch (error: any) {
      console.error('Error updating stage:', error)
      toast.error('Error al actualizar etapa')
    }
  }

  const handleUpdateProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateProspect(prospectId, formData)
      toast.success('Prospecto actualizado exitosamente')
      setShowEditForm(false)
      await loadData()
    } catch (error: any) {
      console.error('Error updating prospect:', error)
      toast.error(error?.message || 'Error al actualizar el prospecto')
    } finally {
      setIsUpdating(false)
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

  const handleResendEmail = async () => {
    setIsResendingEmail(true)
    try {
      await resendActivationEmail(prospectId)
      toast.success('Correo de activación enviado correctamente')
    } catch (error: any) {
      console.error('Error resending email:', error)
      toast.error('Error al enviar el correo de activación')
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleCompleteDataSuccess = async () => {
    await loadData()
    if (pendingStage === 'converted' && prospect) {
      if (prospect.type === 'b2b' && !prospect.is_b2b_active) {
        setShowApproveModal(true)
        return
      }
      try {
        await activateProspect(prospectId)
        await loadData()
        toast.success('Prospecto activado')
      } catch (error: any) {
        console.error('Error updating stage:', error)
        toast.error('Error al activar prospecto')
      } finally {
        setPendingStage(null)
      }
    }
  }

  const handleApproveSuccess = async () => {
    await loadData()
    if (pendingStage === 'converted') {
      try {
        await activateProspect(prospectId)
        await loadData()
        toast.success('Prospecto activado')
      } catch (error: any) {
        console.error('Error updating stage:', error)
        toast.error('Error al activar prospecto')
      } finally {
        setPendingStage(null)
      }
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
            {prospect.fantasy_name || prospect.contact_name}
          </h1>
          {prospect.company_name && (
            <p className="text-slate-500 mt-1 font-medium">{prospect.company_name}</p>
          )}
          {prospect.fantasy_name && prospect.contact_name && (
             <p className="text-slate-400 text-sm mt-0.5">Contacto: {prospect.contact_name}</p>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black uppercase tracking-tight">Información de Contacto</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={isResendingEmail}
                  className="uppercase font-black tracking-wider"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isResendingEmail ? 'Enviando...' : 'Reenviar Activación'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditForm((value) => !value)}
                  className="uppercase font-black tracking-wider"
                >
                  {showEditForm ? 'Ocultar' : 'Editar'}
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
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
              {prospect.contact_role && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Cargo: {prospect.contact_role}</span>
                </div>
              )}
              {prospect.address && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Dirección empresa: {prospect.address}</span>
                </div>
              )}
              {prospect.city && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Ciudad: {prospect.city}</span>
                </div>
              )}
              {prospect.comuna && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Comuna: {prospect.comuna}</span>
                </div>
              )}
              {prospect.business_activity && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Giro: {prospect.business_activity}</span>
                </div>
              )}
              {prospect.requesting_rut && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">RUT solicita: {prospect.requesting_rut}</span>
                </div>
              )}
              {prospect.shipping_address && (
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Dirección de despacho: {prospect.shipping_address}</span>
                </div>
              )}
              {selectedUser && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                  <User className="w-5 h-5 text-calmar-ocean" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario Vinculado</span>
                    <span className="text-sm font-bold text-slate-900">{selectedUser.full_name || 'Sin nombre'} ({selectedUser.email})</span>
                  </div>
                </div>
              )}
            </div>
            {showEditForm && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">
                  Editar Prospecto
                </h3>
                <form onSubmit={handleUpdateProspect} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Tipo
                    </label>
                    <select
                      name="type"
                      defaultValue={prospect.type}
                      className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                    >
                      <option value="b2b">B2B</option>
                      <option value="b2c">B2C</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Nombre de Fantasía
                    </label>
                    <Input name="fantasy_name" defaultValue={prospect.fantasy_name || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Razón Social
                    </label>
                    <Input name="company_name" defaultValue={prospect.company_name || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Nombre de Contacto *
                    </label>
                    <Input name="contact_name" defaultValue={prospect.contact_name || ''} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Cargo del Contacto
                    </label>
                    <Input name="contact_role" defaultValue={prospect.contact_role || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Email *
                    </label>
                    <Input name="email" type="email" defaultValue={prospect.email || ''} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Teléfono
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="phone_country"
                        value={phoneCountry}
                        onChange={(e) => setPhoneCountry(e.target.value)}
                        className="h-11 w-28 rounded-xl border-2 border-slate-200 bg-white px-2 text-sm font-black uppercase tracking-wider text-slate-600"
                      >
                        <option value="56">+56</option>
                        <option value="54">+54</option>
                        <option value="51">+51</option>
                        <option value="57">+57</option>
                        <option value="52">+52</option>
                        <option value="55">+55</option>
                        <option value="34">+34</option>
                        <option value="1">+1</option>
                      </select>
                      <Input
                        name="phone"
                        value={formatLocalPhone(phoneValue)}
                        onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ''))}
                        className="h-11"
                      />
                    </div>
                    {!isPhoneValid && <p className="text-xs text-red-600">Teléfono inválido</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      RUT
                    </label>
                    <RutInput
                      name="tax_id"
                      value={taxIdValue}
                      onChange={(e) => setTaxIdValue(e.target.value)}
                      placeholder="12.345.678-9"
                      className="h-11"
                    />
                    {!isTaxIdValid && <p className="text-xs text-red-600">RUT inválido</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Dirección empresa
                    </label>
                    <Input name="address" defaultValue={prospect.address || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Ciudad
                    </label>
                    <Input name="city" defaultValue={prospect.city || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Comuna
                    </label>
                    <Input name="comuna" defaultValue={prospect.comuna || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Giro
                    </label>
                    <Input name="business_activity" defaultValue={prospect.business_activity || ''} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      RUT solicita
                    </label>
                    <RutInput
                      name="requesting_rut"
                      value={requestingRutValue}
                      onChange={(e) => setRequestingRutValue(e.target.value)}
                      placeholder="12.345.678-9"
                      className="h-11"
                    />
                    {!isRequestingRutValid && <p className="text-xs text-red-600">RUT inválido</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Dirección de despacho
                    </label>
                    <Input name="shipping_address" defaultValue={prospect.shipping_address || ''} className="h-11" />
                  </div>
                  
                  {prospect.type === 'b2b' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                          Línea de Crédito
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <Input 
                            type="number" 
                            name="credit_limit" 
                            defaultValue={prospect.credit_limit || 0} 
                            className="h-11 pl-7" 
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                          Días de Pago
                        </label>
                        <Input 
                          type="number" 
                          name="payment_terms_days" 
                          defaultValue={prospect.payment_terms_days || 30} 
                          className="h-11" 
                          min="0"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Notas
                    </label>
                    <textarea
                      name="notes"
                      defaultValue={prospect.notes || ''}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Vincular Usuario
                    </label>
                    <input type="hidden" name="user_id" value={selectedUser?.id || ''} />
                    {!selectedUser ? (
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            placeholder="Buscar usuario por email o nombre..."
                            className="pl-10 h-11 bg-white"
                          />
                        </div>
                        
                        {isSearching && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-100 rounded-xl p-4 shadow-lg text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Buscando...</p>
                          </div>
                        )}
                        
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-lg overflow-hidden">
                            {searchResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full p-3 text-left hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0"
                              >
                                <span className="text-sm font-bold text-slate-900">{user.full_name || 'Sin nombre'}</span>
                                <span className="text-xs text-slate-500">{user.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {userQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-100 rounded-xl p-4 shadow-lg text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No se encontraron usuarios</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-white border-2 border-calmar-ocean/20 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{selectedUser.full_name || 'Sin nombre'}</span>
                          <span className="text-xs text-slate-500">{selectedUser.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={!isFormValid || isUpdating}
                      className="uppercase font-black tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
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
                        {movement.movement_type === 'sample' ? (
                          <span className="font-bold text-emerald-600">GRATIS</span>
                        ) : (
                          `$${Number(movement.total_amount).toLocaleString('es-CL')}`
                        )}
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

          {/* Marketing Deliveries */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black uppercase tracking-tight">Material Publicitario</h2>
            </div>

            <div className="space-y-3">
              {marketingDeliveries.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No hay entregas registradas</p>
              ) : (
                marketingDeliveries.map((delivery) => (
                  <Link
                    key={delivery.id}
                    href={`/purchases/${delivery.purchase_id}`}
                    className="block p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-calmar-ocean transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                          {delivery.item_type}
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          {delivery.quantity} unidades
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-black uppercase tracking-wider ${
                        delivery.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        delivery.delivery_status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        delivery.delivery_status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {{
                          pending: 'Pendiente',
                          scheduled: 'Programada',
                          delivered: 'Entregada',
                          partial: 'Parcial'
                        }[delivery.delivery_status as string] || delivery.delivery_status}
                      </span>
                    </div>
                    
                    {delivery.purchase && (
                       <p className="text-xs text-slate-500 mb-2">
                         Compra: {delivery.purchase.description}
                       </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      {(delivery.scheduled_date || delivery.delivered_date) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(delivery.delivered_date || delivery.scheduled_date).toLocaleDateString('es-CL')}
                        </span>
                      )}
                      {delivery.delivery_address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Building2 className="w-3 h-3" />
                          {delivery.delivery_address}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {prospect.type === 'b2b' && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black uppercase tracking-tight">Configuración B2B</h2>
                <ShieldCheck className="w-5 h-5 text-calmar-mint" />
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</p>
                  <p className={`text-sm font-bold ${prospect.is_b2b_active ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {prospect.is_b2b_active ? 'Activo' : 'Pendiente de activación'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Línea de crédito</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatClp(Number(prospect.credit_limit || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Días de pago</p>
                  <p className="text-sm font-bold text-slate-900">
                    {Number(prospect.payment_terms_days || 30)} días
                  </p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Precios Especiales</p>
                  {productPrices.length > 0 ? (
                    <div className="space-y-2">
                      {productPrices.map((price) => (
                        <div key={price.productId} className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{price.productName}</p>
                            <p className="text-slate-400 text-[10px]">{price.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{formatClp(Number(price.fixedPrice))}</p>
                            <p className="text-slate-400 line-through text-[10px]">{formatClp(Number(price.basePrice))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Se usan los precios base para todos los productos</p>
                  )}
                </div>

                <Button
                  onClick={() => setShowApproveModal(true)}
                  variant="outline"
                  className="w-full uppercase font-black tracking-wider"
                >
                  Configurar B2B
                </Button>
              </div>
            </div>
          )}
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
                  Material Publicitario
                </p>
                <p className="text-2xl font-black text-slate-900">{marketingDeliveries.length}</p>
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

      {prospect.type === 'b2b' && (
        <ApproveB2BModal
          prospectId={prospectId}
          companyName={prospect.company_name || prospect.contact_name}
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onSuccess={handleApproveSuccess}
          initialCreditLimit={prospect.credit_limit}
          initialPaymentTermsDays={prospect.payment_terms_days}
        />
      )}

      <CompleteDataModal
        prospect={prospect}
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false)
          setPendingStage(null)
        }}
        onSuccess={handleCompleteDataSuccess}
      />
    </div>
  )
}
