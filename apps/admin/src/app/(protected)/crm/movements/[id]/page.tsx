'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CRMService, ProductService } from '@calmar/database'
import { ArrowLeft, DollarSign, Calendar, Package, AlertCircle, CheckCircle, Plus, UserX, FileText, Upload, Trash2, ExternalLink, Eye, CheckCircle2, XCircle, Pencil, X } from 'lucide-react'
import { Button, Input } from '@calmar/ui'
import Link from 'next/link'
import { updateMovementStatus, registerPayment, returnConsignment, convertConsignmentToSale, uploadMovementDocument, deleteMovementDocument, approvePayment, rejectPayment, deleteMovement, updateMovement } from '../../actions'
import { toast } from 'sonner'

const STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Entregado', color: 'bg-blue-100 text-blue-700' },
  returned: { label: 'Devuelto', color: 'bg-gray-100 text-gray-700' },
  sold: { label: 'Vendido', color: 'bg-green-100 text-green-700' },
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
  partial_paid: { label: 'Pago Parcial', color: 'bg-amber-100 text-amber-700' },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700' }
}

export default function MovementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const movementId = params.id as string
  
  const [movement, setMovement] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'transfer' as 'cash' | 'transfer' | 'check' | 'credit_card' | 'other',
    payment_reference: '',
    notes: ''
  })
  const [editForm, setEditForm] = useState({
    notes: '',
    due_date: '',
    delivery_date: '',
    invoice_date: '',
    sample_recipient_name: '',
    sample_event_context: ''
  })
  
  // Product editing states
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [editItems, setEditItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({
    product_id: '',
    variant_id: '',
    quantity: 1,
    unit_price: 0
  })

  // Prospect prices state
  const [prospectPrices, setProspectPrices] = useState<Map<string, number>>(new Map())
  const [isLoadingProspectPrices, setIsLoadingProspectPrices] = useState(false)

  const loadMovement = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      const data = await crmService.getMovementById(movementId)
      setMovement(data)
      // Initialize edit form with current values
      setEditForm({
        notes: data?.notes || '',
        due_date: data?.due_date ? data.due_date.split('T')[0] : '',
        delivery_date: data?.delivery_date ? data.delivery_date.split('T')[0] : '',
        invoice_date: data?.invoice_date ? data.invoice_date.split('T')[0] : '',
        sample_recipient_name: data?.sample_recipient_name || '',
        sample_event_context: data?.sample_event_context || ''
      })
      setEditItems(data?.items || [])
      
      // Load prospect prices if available
      if (data?.prospect_id) {
        loadProspectPrices(data.prospect_id)
      }
    } catch (error: any) {
      console.error('Error loading movement:', error)
      toast.error('Error al cargar movimiento')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProducts = async () => {
    if (products.length > 0) return
    
    setIsLoadingProducts(true)
    const supabase = createClient()
    const productService = new ProductService(supabase)
    
    try {
      const data = await productService.getProducts({ activeOnly: true })
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const loadProspectPrices = async (prospectId: string) => {
    setIsLoadingProspectPrices(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('prospect_product_prices')
        .select('product_id, fixed_price')
        .eq('prospect_id', prospectId)

      if (error) throw error

      const priceMap = new Map(
        (data || []).map(price => [price.product_id, Number(price.fixed_price)])
      )
      setProspectPrices(priceMap)
    } catch (error) {
      console.error('Error loading prospect prices:', error)
      toast.error('No se pudieron cargar los precios del prospecto')
    } finally {
      setIsLoadingProspectPrices(false)
    }
  }

  useEffect(() => {
    if (movementId) {
      loadMovement()
    }
  }, [movementId])

  useEffect(() => {
    if (isEditing) {
      loadProducts()
    }
  }, [isEditing])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateMovementStatus(movementId, newStatus)
      await loadMovement()
      toast.success('Estado actualizado')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    try {
      await registerPayment({
        movement_id: movementId,
        amount,
        payment_method: paymentForm.payment_method,
        payment_reference: paymentForm.payment_reference || undefined,
        notes: paymentForm.notes || undefined
      })
      
      toast.success('Pago registrado')
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        payment_method: 'transfer',
        payment_reference: '',
        notes: ''
      })
      await loadMovement()
    } catch (error: any) {
      console.error('Error registering payment:', error)
      toast.error('Error al registrar pago')
    }
  }

  const handleReturnConsignment = async () => {
    if (!confirm('¿Estás seguro de devolver esta consignación? Esto restaurará el stock.')) {
      return
    }

    try {
      await returnConsignment(movementId, movement.items)
      await loadMovement()
      toast.success('Consignación devuelta')
    } catch (error: any) {
      console.error('Error returning consignment:', error)
      toast.error('Error al devolver consignación')
    }
  }

  const handleConvertToSale = async () => {
    if (!confirm('¿Convertir esta consignación en venta? Esto actualizará el estado.')) {
      return
    }

    try {
      await convertConsignmentToSale(movementId)
      await loadMovement()
      toast.success('Consignación convertida a venta')
    } catch (error: any) {
      console.error('Error converting to sale:', error)
      toast.error('Error al convertir consignación')
    }
  }

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de aprobar este pago?')) return
    try {
      await approvePayment(paymentId)
      toast.success('Pago aprobado')
      await loadMovement()
    } catch (error) {
      toast.error('Error al aprobar pago')
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Motivo del rechazo:')
    if (reason === null) return
    if (!reason.trim()) {
      toast.error('Debes ingresar un motivo')
      return
    }
    try {
      await rejectPayment(paymentId, reason)
      toast.success('Pago rechazado')
      await loadMovement()
    } catch (error) {
      toast.error('Error al rechazar pago')
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este movimiento? Esta acción eliminará también todos los pagos asociados y no se puede deshacer.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteMovement(movementId)
      toast.success('Movimiento eliminado')
      router.push('/crm/movements')
    } catch (error: any) {
      console.error('Error deleting movement:', error)
      toast.error('Error al eliminar movimiento')
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Calculate new total amount
      const newTotalAmount = movement.movement_type === 'sample' ? 0 : editItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      await updateMovement(movementId, {
        notes: editForm.notes || null,
        due_date: editForm.due_date || null,
        delivery_date: editForm.delivery_date || null,
        invoice_date: editForm.invoice_date || null,
        sample_recipient_name: editForm.sample_recipient_name || null,
        sample_event_context: editForm.sample_event_context || null,
        items: editItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: Number(item.quantity),
          unit_price: movement.movement_type === 'sample' ? 0 : Number(item.unit_price)
        })),
        total_amount: newTotalAmount
      })
      
      toast.success('Movimiento actualizado')
      setIsEditing(false)
      await loadMovement()
    } catch (error: any) {
      console.error('Error updating movement:', error)
      toast.error('Error al actualizar movimiento')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    // Reset form to current values
    setEditForm({
      notes: movement?.notes || '',
      due_date: movement?.due_date ? movement.due_date.split('T')[0] : '',
      delivery_date: movement?.delivery_date ? movement.delivery_date.split('T')[0] : '',
      invoice_date: movement?.invoice_date ? movement.invoice_date.split('T')[0] : '',
      sample_recipient_name: movement?.sample_recipient_name || '',
      sample_event_context: movement?.sample_event_context || ''
    })
    setEditItems(movement?.items || [])
    setNewItem({
      product_id: '',
      variant_id: '',
      quantity: 1,
      unit_price: 0
    })
    setIsEditing(false)
  }

  const handleAddEditItem = () => {
    if (!newItem.product_id || newItem.quantity <= 0) {
      toast.error('Selecciona un producto y cantidad válida')
      return
    }

    const product = products.find(p => p.id === newItem.product_id)
    if (!product) return

    const variant = product.variants?.find((v: any) => v.id === newItem.variant_id)

    const itemToAdd = {
      product_id: newItem.product_id,
      variant_id: newItem.variant_id || null,
      quantity: newItem.quantity,
      unit_price: movement.movement_type === 'sample' ? 0 : newItem.unit_price,
      product: product,
      variant: variant
    }

    setEditItems([...editItems, itemToAdd])
    setNewItem({
      product_id: '',
      variant_id: '',
      quantity: 1,
      unit_price: 0
    })
  }

  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  const handleUpdateEditItem = (index: number, field: string, value: any) => {
    const newItems = [...editItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditItems(newItems)
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando...</p>
      </div>
    )
  }

  if (!movement) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Movimiento no encontrado</p>
        <Link href="/crm/movements">
          <Button>Volver a Movimientos</Button>
        </Link>
      </div>
    )
  }

  const totalPaid = movement.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  const remainingBalance = Number(movement.total_amount) - totalPaid
  const statusInfo = STATUSES[movement.status as keyof typeof STATUSES]

  // Determine if prices are Net (+IVA) or Gross (IVA included)
  // Logic: Invoices and B2B clients usually work with Net prices, but stored amount is Gross
  const isNetPrice = movement.movement_type === 'sale_invoice' || movement.prospect?.type === 'b2b'
  
  // Helper to calculate net price
  const getNetPrice = (grossPrice: number) => {
    return grossPrice / 1.19
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Link href="/crm/movements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">
            {movement.movement_number}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {movement.movement_type === 'sample' ? 'Muestra' :
             movement.movement_type === 'consignment' ? 'Consignación' :
             movement.movement_type === 'sale_invoice' ? 'Venta Factura' : 'Venta Crédito'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider ${statusInfo?.color || 'bg-slate-100 text-slate-700'}`}>
            {statusInfo?.label || movement.status}
          </span>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="uppercase font-black tracking-wider"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="uppercase font-black tracking-wider text-red-600 border-red-200 hover:bg-red-50"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Cliente / Receptor</h2>
            {movement.prospect && (
              <div className="space-y-4">
                {/* Principal Info */}
                <div>
                  <Link 
                    href={`/crm/prospects/${movement.prospect.id}`}
                    className="font-bold text-slate-900 hover:text-calmar-ocean hover:underline flex items-center gap-2"
                  >
                    {movement.prospect.fantasy_name || movement.prospect.contact_name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  {movement.prospect.fantasy_name && movement.prospect.contact_name && (
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
                      Contacto: {movement.prospect.contact_name}
                    </p>
                  )}
                  {movement.prospect.contact_role && (
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      {movement.prospect.contact_role}
                    </p>
                  )}
                  {movement.prospect.company_name && (
                    <p className="text-sm font-medium text-slate-700 mt-1">{movement.prospect.company_name}</p>
                  )}
                  {movement.prospect.business_activity && (
                    <p className="text-xs text-slate-500 italic">
                      {movement.prospect.business_activity}
                    </p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Contacto</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Email:</span>
                      <span className="break-all">{movement.prospect.email}</span>
                    </p>
                    {movement.prospect.phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Teléfono:</span>
                        {movement.prospect.phone}
                      </p>
                    )}
                    {movement.prospect.tax_id && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">RUT:</span>
                        {movement.prospect.tax_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address Info */}
                {(movement.prospect.address || movement.prospect.city || movement.prospect.comuna || movement.prospect.shipping_address) && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Dirección</h3>
                    <div className="space-y-1">
                      {movement.prospect.address && (
                        <p className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Dirección:</span>
                          <span>{movement.prospect.address}</span>
                        </p>
                      )}
                      {(movement.prospect.city || movement.prospect.comuna) && (
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Ciudad/Com:</span>
                          <span>
                            {[movement.prospect.city, movement.prospect.comuna].filter(Boolean).join(', ')}
                          </span>
                        </p>
                      )}
                      {movement.prospect.shipping_address && (
                        <p className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Envío:</span>
                          <span>{movement.prospect.shipping_address}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Commercial Info */}
                {(movement.prospect.credit_limit > 0 || movement.prospect.payment_terms_days) && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Condiciones</h3>
                    <div className="space-y-1">
                      {movement.prospect.credit_limit > 0 && (
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Crédito:</span>
                          <span>${Number(movement.prospect.credit_limit).toLocaleString('es-CL')}</span>
                        </p>
                      )}
                      {movement.prospect.payment_terms_days && (
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Plazo:</span>
                          <span>{movement.prospect.payment_terms_days} días</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {movement.customer && (
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-slate-900">
                    {movement.customer.full_name || movement.customer.email}
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-full mt-1">
                    Usuario Registrado
                  </span>
                </div>
                
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Contacto</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Email:</span>
                      <span className="break-all">{movement.customer.email}</span>
                    </p>
                    {movement.customer.rut && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">RUT:</span>
                        {movement.customer.rut}
                      </p>
                    )}
                    {movement.customer.phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-400 w-20 shrink-0">Teléfono:</span>
                        {movement.customer.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Anonymous sample recipient */}
            {movement.movement_type === 'sample' && 
             !movement.prospect && 
             !movement.customer && 
             (movement.sample_recipient_name || movement.sample_event_context) && (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Muestra sin cliente asociado
                  </span>
                </div>
                {movement.sample_recipient_name && (
                  <p className="font-bold text-slate-900">
                    Receptor: {movement.sample_recipient_name}
                  </p>
                )}
                {movement.sample_event_context && (
                  <p className="text-sm text-slate-600 mt-1">
                    Contexto: {movement.sample_event_context}
                  </p>
                )}
              </div>
            )}
            
            {/* No client assigned */}
            {!movement.prospect && 
             !movement.customer && 
             !movement.sample_recipient_name && 
             !movement.sample_event_context && (
              <p className="text-sm text-slate-400 italic">Sin cliente asignado</p>
            )}
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Productos</h2>
            <div className="space-y-3">
              {movement.items?.map((item: any, index: number) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                      {item.product?.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.product?.name || `Producto ID: ${item.product_id}`}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          SKU: {item.product?.sku || 'N/A'}
                        </p>
                        
                        {item.variant ? (
                          <div className="flex gap-2 text-sm text-slate-600">
                            {item.variant.flavor && (
                              <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-medium">
                                {item.variant.flavor}
                              </span>
                            )}
                            {item.variant.size && (
                              <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-medium">
                                {item.variant.size}
                              </span>
                            )}
                          </div>
                        ) : item.variant_id && (
                          <p className="text-sm text-slate-600">Variante ID: {item.variant_id}</p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Cantidad: {item.quantity}</p>
                        {movement.movement_type === 'sample' ? (
                          <p className="text-sm font-black text-emerald-600 mt-1">
                            GRATIS
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-slate-900">
                              ${item.unit_price.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-500">(IVA incl.)</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Neto: ${getNetPrice(item.unit_price).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm font-black text-slate-900 mt-1">
                              Total: ${(item.quantity * item.unit_price).toLocaleString('es-CL')}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          {movement.movement_type !== 'sample' && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black uppercase tracking-tight">Pagos</h2>
                {remainingBalance > 0 && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="uppercase font-black tracking-wider"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                )}
              </div>

              <div className="space-y-3 mb-4">
                {movement.payments && movement.payments.length > 0 ? (
                  movement.payments.map((payment: any) => (
                    <div key={payment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900">
                            ${Number(payment.amount).toLocaleString('es-CL')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              payment.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              payment.verification_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payment.verification_status === 'approved' ? 'Aprobado' :
                               payment.verification_status === 'pending' ? 'Pendiente Verificación' :
                               'Rechazado'}
                            </span>
                            <p className="text-xs text-slate-600">
                              {payment.payment_method} 
                              {payment.payment_reference && ` - Ref: ${payment.payment_reference}`}
                            </p>
                          </div>
                          {payment.payment_proof_url && (
                            <a 
                              href={payment.payment_proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-calmar-ocean hover:underline mt-1"
                            >
                              <Eye className="h-3 w-3" />
                              Ver comprobante
                            </a>
                          )}
                          {payment.rejection_reason && (
                            <p className="text-[10px] text-red-600 italic mt-1">
                              Motivo rechazo: {payment.rejection_reason}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-slate-500">
                            {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-CL')}
                          </span>
                          {payment.verification_status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleApprovePayment(payment.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectPayment(payment.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No hay pagos registrados</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-700">
                    Total (IVA incl.):
                  </span>
                  <div className="text-right">
                    {movement.movement_type === 'sample' ? (
                      <span className="text-lg font-black text-emerald-600 block">
                        GRATIS
                      </span>
                    ) : (
                      <>
                        <span className="text-lg font-black text-slate-900 block">
                          ${Number(movement.total_amount).toLocaleString('es-CL')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Neto: ${getNetPrice(Number(movement.total_amount)).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {movement.movement_type !== 'sample' && (
                  <>
                    {isNetPrice && (
                      <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 mt-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Monto Neto:</span>
                          <span>${getNetPrice(Number(movement.total_amount)).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>IVA (19%):</span>
                          <span>${(Number(movement.total_amount) - getNetPrice(Number(movement.total_amount))).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                          <span>Total a Pagar:</span>
                          <span>${Number(movement.total_amount).toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-200">
                      <span className="text-sm font-bold text-slate-700">Pagado:</span>
                      <span className="text-lg font-black text-green-600">
                        ${totalPaid.toLocaleString('es-CL')}
                      </span>
                    </div>
                    {remainingBalance > 0 && (
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-sm font-black uppercase tracking-wider text-orange-600">
                          Pendiente:
                        </span>
                        <span className="text-xl font-black text-orange-600">
                          ${remainingBalance.toLocaleString('es-CL')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Documentos</h2>
            <div className="space-y-4">
              {/* Invoice/Receipt */}
              <DocumentUpload
                label="Factura / Boleta"
                movementId={movementId}
                documentType="invoice"
                currentUrl={movement.invoice_url}
                onUploadComplete={loadMovement}
              />
              
              {/* Dispatch Order */}
              <DocumentUpload
                label="Orden de Despacho"
                movementId={movementId}
                documentType="dispatch_order"
                currentUrl={movement.dispatch_order_url}
                onUploadComplete={loadMovement}
              />
            </div>
          </div>

          {/* Notes */}
          {movement.notes && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Notas</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{movement.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Estado</h2>
            <select
              value={movement.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none font-bold uppercase tracking-wider text-sm"
            >
              {Object.entries(STATUSES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">Fechas</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Creado
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(movement.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>

              {movement.delivery_date && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    Entrega
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(movement.delivery_date).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}

              {movement.invoice_date && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    Fecha Factura
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(movement.invoice_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                  </p>
                </div>
              )}

              {movement.due_date && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    Vencimiento Factura
                  </p>
                  <p className={`text-sm font-medium ${
                    new Date(movement.due_date) < new Date() && remainingBalance > 0
                      ? 'text-red-600'
                      : 'text-slate-900'
                  }`}>
                    {new Date(movement.due_date).toLocaleDateString('es-CL')}
                    {new Date(movement.due_date) < new Date() && remainingBalance > 0 && (
                      <AlertCircle className="w-4 h-4 inline-block ml-2" />
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {movement.movement_type === 'consignment' && movement.status === 'delivered' && (
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Acciones</h2>
              <div className="space-y-3">
                <Button
                  onClick={handleConvertToSale}
                  className="w-full uppercase font-black tracking-wider"
                >
                  Convertir a Venta
                </Button>
                <Button
                  onClick={handleReturnConsignment}
                  variant="outline"
                  className="w-full uppercase font-black tracking-wider"
                >
                  Devolver Consignación
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">Registrar Pago</h2>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Monto *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder={`Máximo: ${remainingBalance.toLocaleString('es-CL')}`}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none"
                  required
                >
                  <option value="transfer">Transferencia</option>
                  <option value="cash">Efectivo</option>
                  <option value="check">Cheque</option>
                  <option value="credit_card">Tarjeta de Crédito</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Referencia
                </label>
                <Input
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                  placeholder="Número de transacción, cheque, etc."
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentForm({
                      amount: '',
                      payment_method: 'transfer',
                      payment_reference: '',
                      notes: ''
                    })
                  }}
                  className="flex-1 uppercase font-black tracking-wider"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 uppercase font-black tracking-wider"
                >
                  Registrar Pago
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight">Editar Movimiento</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* Products Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-2">
                  Productos
                </h3>
                
                {/* Add Product Form */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Producto
                      </label>
                      <select
                        value={newItem.product_id}
                        onChange={(e) => {
                          const product = products.find(p => p.id === e.target.value)
                          let resolvedPrice = 0
                          
                          if (product) {
                            if (movement.movement_type === 'sample') {
                              resolvedPrice = 0
                            } else {
                              const fixedPrice = prospectPrices.get(product.id)
                              resolvedPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
                                ? fixedPrice
                                : Number(product.base_price)
                            }
                          }

                          setNewItem({
                            ...newItem,
                            product_id: e.target.value,
                            variant_id: '',
                            unit_price: resolvedPrice
                          })
                        }}
                        className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                        disabled={isLoadingProducts || isLoadingProspectPrices}
                      >
                        <option value="">
                          {isLoadingProspectPrices ? 'Cargando precios...' : 'Seleccionar...'}
                        </option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {newItem.product_id && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Variante
                        </label>
                        <select
                          value={newItem.variant_id}
                          onChange={(e) => setNewItem({ ...newItem, variant_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                        >
                          <option value="">Sin variante</option>
                          {products.find(p => p.id === newItem.product_id)?.variants?.map((variant: any) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Cant.
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        className="h-9"
                      />
                    </div>
                    {movement.movement_type !== 'sample' && (
                      <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Precio
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                          className={`h-9 ${newItem.product_id && prospectPrices.has(newItem.product_id) ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : ''}`}
                        />
                        {newItem.product_id && prospectPrices.has(newItem.product_id) && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] leading-tight">
                            <span className="text-emerald-600 font-bold uppercase tracking-wider">
                              Precio prospecto
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`col-span-1 flex items-end ${movement.movement_type === 'sample' ? 'col-start-3' : ''}`}>
                      <Button
                        type="button"
                        onClick={handleAddEditItem}
                        className="w-full h-9 uppercase font-black tracking-wider text-xs"
                        size="sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {item.product?.name || 'Producto'}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-slate-500 truncate">
                            {item.variant.name}
                          </p>
                        )}
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateEditItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8 text-xs"
                        />
                      </div>
                      {movement.movement_type !== 'sample' && (
                        <div className="w-24">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleUpdateEditItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editItems.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4 italic">
                      No hay productos en el movimiento
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-700">Total Nuevo:</span>
                  <span className="text-lg font-black text-slate-900">
                    {movement.movement_type === 'sample' ? 'GRATIS' : `$${editItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString('es-CL')}`}
                  </span>
                </div>
              </div>

              {/* Other Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-2">
                  Detalles Generales
                </h3>
                
                {/* Fecha de Factura */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Fecha de Factura
                  </label>
                  <Input
                    type="date"
                    value={editForm.invoice_date}
                    onChange={(e) => setEditForm({ ...editForm, invoice_date: e.target.value })}
                    className="h-12"
                  />
                </div>

                {/* Fecha de Entrega */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Fecha de Entrega
                  </label>
                  <Input
                    type="date"
                    value={editForm.delivery_date}
                    onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
                    className="h-12"
                  />
                </div>

                {/* Fecha de Vencimiento */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <Input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="h-12"
                  />
                </div>

                {/* Campos para muestras */}
                {movement.movement_type === 'sample' && (
                  <>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Nombre del Receptor
                      </label>
                      <Input
                        value={editForm.sample_recipient_name}
                        onChange={(e) => setEditForm({ ...editForm, sample_recipient_name: e.target.value })}
                        placeholder="Nombre de quien recibe la muestra"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Contexto / Evento
                      </label>
                      <Input
                        value={editForm.sample_event_context}
                        onChange={(e) => setEditForm({ ...editForm, sample_event_context: e.target.value })}
                        placeholder="Ej: Feria de diseño, Reunión comercial..."
                        className="h-12"
                      />
                    </div>
                  </>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-slate-100 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 uppercase font-black tracking-wider"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 uppercase font-black tracking-wider"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Document Upload Component
function DocumentUpload({
  label,
  movementId,
  documentType,
  currentUrl,
  onUploadComplete
}: {
  label: string
  movementId: string
  documentType: 'invoice' | 'dispatch_order'
  currentUrl: string | null
  onUploadComplete: () => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (PDF, images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF o imágenes')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 10MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('movementId', movementId)
      formData.append('documentType', documentType)

      const result = await uploadMovementDocument(formData)
      
      if (result.success) {
        toast.success('Documento subido')
        onUploadComplete()
      } else {
        toast.error(result.error || 'Error al subir documento')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Error al subir documento')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return

    setIsDeleting(true)
    try {
      const result = await deleteMovementDocument(movementId, documentType)
      
      if (result.success) {
        toast.success('Documento eliminado')
        onUploadComplete()
      } else {
        toast.error(result.error || 'Error al eliminar documento')
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Error al eliminar documento')
    } finally {
      setIsDeleting(false)
    }
  }

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return 'image'
    if (extension === 'pdf') return 'pdf'
    return 'unknown'
  }

  const fileType = currentUrl ? getFileType(currentUrl) : null

  return (
    <>
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="font-bold text-sm text-slate-700">{label}</span>
          </div>
          
          {currentUrl ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1 text-xs font-bold text-calmar-ocean hover:underline"
              >
                <Eye className="w-4 h-4" />
                Ver
              </button>
              <div className="w-px h-3 bg-slate-300 mx-1" />
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-calmar-ocean"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 ml-1"
                title="Eliminar documento"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <span className="flex items-center gap-1 text-xs font-bold text-calmar-ocean hover:underline">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-calmar-ocean border-t-transparent rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir documento
                  </>
                )}
              </span>
            </label>
          )}
        </div>

        {/* Inline Preview */}
        {currentUrl && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            {fileType === 'image' && (
              <div 
                className="relative w-full h-48 bg-white rounded-lg overflow-hidden cursor-pointer group border border-slate-200 shadow-sm"
                onClick={() => setShowPreview(true)}
              >
                <img 
                  src={currentUrl} 
                  alt={label} 
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
                </div>
              </div>
            )}
            {fileType === 'pdf' && (
              <div className="w-full h-[300px] bg-white rounded-lg overflow-hidden border border-slate-200 relative group shadow-sm">
                <iframe 
                  src={`${currentUrl}#toolbar=0&view=FitH`} 
                  className="w-full h-full" 
                  title={label}
                />
                <div 
                  className="absolute inset-0 bg-transparent cursor-pointer"
                  onClick={() => setShowPreview(true)}
                >
                  <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                    <Eye className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {showPreview && currentUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-full max-h-[95vh] flex flex-col bg-transparent">
            {/* Toolbar */}
            <div className="flex items-center justify-between text-white mb-4 px-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                {label}
              </h3>
              <div className="flex items-center gap-2">
                <a 
                  href={currentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-sm font-bold"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir original
                </a>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-slate-900/50 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 relative shadow-2xl">
              {fileType === 'image' ? (
                <img 
                  src={currentUrl} 
                  alt={label} 
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <iframe 
                  src={currentUrl} 
                  className="w-full h-full bg-white" 
                  title={label}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
