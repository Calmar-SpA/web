'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductService, CRMService } from '@calmar/database'
import { createMovement } from '../../actions'
import { Button, Input } from '@calmar/ui'
import { ArrowLeft, Plus, X, Save, Users, UserX, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface MovementItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  unit_price: number
  product_name?: string
  variant_name?: string
}

interface Prospect {
  id: string
  contact_name: string
  company_name?: string
  fantasy_name?: string
  email: string
  type: 'b2b' | 'b2c'
  stage?: string
  converted_to_client_id?: string | null
  converted_to_type?: 'b2b' | 'b2c' | null
  credit_limit?: number
}

export default function NewMovementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <NewMovementContent />
    </Suspense>
  )
}

function NewMovementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'sample'
  const prospectId = searchParams.get('prospect_id')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  
  // For samples without client association
  const [isAnonymousSample, setIsAnonymousSample] = useState(false)
  // For boleta without client association
  const [isAnonymousBoleta, setIsAnonymousBoleta] = useState(false)
  
  const [formData, setFormData] = useState({
    movement_type: defaultType as 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit' | 'sale_boleta',
    prospect_id: prospectId || '',
    customer_user_id: '',
    due_date: '',
    delivery_date: '',
    notes: '',
    // New fields for anonymous samples
    sample_recipient_name: '',
    sample_event_context: '',
    // New field for anonymous boleta
    boleta_buyer_name: ''
  })
  const [items, setItems] = useState<MovementItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemPrice, setItemPrice] = useState(0)
  const [prospectPrices, setProspectPrices] = useState<Map<string, number>>(new Map())
  const [isLoadingProspectPrices, setIsLoadingProspectPrices] = useState(false)
  const [prospectCreditLimit, setProspectCreditLimit] = useState<number>(0)

  useEffect(() => {
    loadProducts()
    loadClientsAndProspects()
  }, [])

  const loadProducts = async () => {
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

  const loadClientsAndProspects = async () => {
    setIsLoadingClients(true)
    const supabase = createClient()
    
    try {
      const { data: prospectsData } = await supabase
        .from('prospects')
        .select('id, contact_name, company_name, fantasy_name, email, type, stage, converted_to_client_id, converted_to_type, credit_limit')
        .order('created_at', { ascending: false })
      
      setProspects(prospectsData || [])

      // If prospect_id is provided, set it
      if (prospectId) {
        await handleProspectSelection(prospectId)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Error al cargar prospectos/clientes')
    } finally {
      setIsLoadingClients(false)
    }
  }

  const handleProspectSelection = async (selectedProspectId: string) => {
    setFormData(prev => ({ ...prev, prospect_id: selectedProspectId }))

    if (!selectedProspectId) {
      setProspectCreditLimit(0)
      setProspectPrices(new Map())
      if (selectedProduct) {
        const product = products.find(p => p.id === selectedProduct)
        if (product) {
          setItemPrice(Number(product.base_price))
        }
      }
      return
    }

    setIsLoadingProspectPrices(true)
    const supabase = createClient()

    try {
      // 1. Get fresh credit limit
      const { data: freshProspect } = await supabase
        .from('prospects')
        .select('credit_limit')
        .eq('id', selectedProspectId)
        .single()
      
      if (freshProspect) {
        setProspectCreditLimit(Number(freshProspect.credit_limit || 0))
      }

      // 2. Get product prices
      const { data, error } = await supabase
        .from('prospect_product_prices')
        .select('product_id, fixed_price')
        .eq('prospect_id', selectedProspectId)

      if (error) throw error

      const priceMap = new Map(
        (data || []).map(price => [price.product_id, Number(price.fixed_price)])
      )
      setProspectPrices(priceMap)
      
      // ... rest of the logic


      if (selectedProduct) {
        const product = products.find(p => p.id === selectedProduct)
        if (product) {
          if (formData.movement_type === 'sample') {
            setItemPrice(0)
          } else {
            const fixedPrice = priceMap.get(product.id)
            const resolvedPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
              ? fixedPrice
              : Number(product.base_price)
            setItemPrice(resolvedPrice)
          }
        }
      }
    } catch (error) {
      console.error('Error loading B2B prices:', error)
      toast.error('No se pudieron cargar los precios B2B')
      setProspectPrices(new Map())
    } finally {
      setIsLoadingProspectPrices(false)
    }
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)
  const isProspectPrice = selectedProduct && prospectPrices.has(selectedProduct)
  const basePrice = selectedProductData ? Number(selectedProductData.base_price) : 0

  const handleAddItem = () => {
    if (!selectedProduct || itemQuantity <= 0) {
      toast.error('Selecciona un producto y cantidad válida')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const variant = product.variants?.find((v: any) => v.id === selectedVariant)
    // Allow $0 price for samples - only use base_price as default when adding product
    const unitPrice = formData.movement_type === 'sample' ? 0 : itemPrice

    const newItem: MovementItem = {
      product_id: selectedProduct,
      variant_id: selectedVariant || null,
      quantity: itemQuantity,
      unit_price: unitPrice,
      product_name: product.name,
      variant_name: variant?.name
    }

    setItems([...items, newItem])
    setSelectedProduct('')
    setSelectedVariant('')
    setItemQuantity(1)
    setItemPrice(0)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('handleSubmit called', { formData, items, isAnonymousSample })
    
    if (items.length === 0) {
      console.log('Validation failed: no items')
      toast.error('Agrega al menos un producto')
      return
    }

    // For non-sample movements, require client association unless it's an anonymous boleta
    if (formData.movement_type !== 'sample' && !formData.prospect_id && !formData.customer_user_id) {
      if (formData.movement_type === 'sale_boleta' && isAnonymousBoleta) {
        // Allow if anonymous boleta
      } else {
        console.log('Validation failed: no client for non-sample')
        toast.error('Selecciona un prospecto o cliente')
        return
      }
    }

    // For samples, if not anonymous, require client OR mark as anonymous
    if (formData.movement_type === 'sample' && !isAnonymousSample && !formData.prospect_id) {
      console.log('Validation failed: sample needs client or anonymous flag')
      toast.error('Selecciona un prospecto o marca como muestra sin cliente')
      return
    }

    // For anonymous samples, require at least recipient name or context
    if (formData.movement_type === 'sample' && isAnonymousSample && !formData.sample_recipient_name && !formData.sample_event_context) {
      console.log('Validation failed: anonymous sample needs recipient or context')
      toast.error('Indica el nombre del receptor o el contexto/evento')
      return
    }

    // For anonymous boleta, require buyer name if configured (optional per requirements, but good practice)
    // User requested optional name, so no strict validation here for name presence

    // Validate credit limit for consignments
    if (formData.movement_type === 'consignment' && totalAmount > prospectCreditLimit) {
      toast.error(`Crédito insuficiente. Disponible: $${prospectCreditLimit.toLocaleString('es-CL')}`)
      return
    }

    setIsSubmitting(true)

    try {
      await createMovement({
        movement_type: formData.movement_type,
        prospect_id: (isAnonymousSample || isAnonymousBoleta) ? null : (formData.prospect_id || null),
        customer_user_id: formData.customer_user_id || null,
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        total_amount: totalAmount,
        due_date: formData.due_date || null,
        delivery_date: formData.delivery_date || null,
        notes: formData.notes || undefined,
        sample_recipient_name: isAnonymousSample ? (formData.sample_recipient_name || null) : null,
        sample_event_context: isAnonymousSample ? (formData.sample_event_context || null) : null,
        boleta_buyer_name: isAnonymousBoleta ? (formData.boleta_buyer_name || null) : null
      })
      
      toast.success('Movimiento creado exitosamente')
      router.push('/crm/movements')
    } catch (error: any) {
      console.error('Error creating movement:', error)
      toast.error(error.message || 'Error al crear movimiento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/crm/movements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Nuevo <span className="text-calmar-ocean">Movimiento</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Registrar muestra, consignación o venta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Movement Type */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
            Tipo de Movimiento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(['sample', 'consignment', 'sale_invoice', 'sale_credit', 'sale_boleta'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, movement_type: type })
                  // Reset anonymous states when changing movement type
                  if (type !== 'sample') {
                    setIsAnonymousSample(false)
                  }
                  if (type !== 'sale_boleta') {
                    setIsAnonymousBoleta(false)
                  }
                  
                  // Reset price if switching to/from sample
                  if (type === 'sample') {
                    setItemPrice(0)
                  } else if (selectedProduct) {
                    const product = products.find(p => p.id === selectedProduct)
                    if (product) {
                       const fixedPrice = prospectPrices.get(product.id)
                       const resolvedPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
                         ? fixedPrice
                         : Number(product.base_price)
                       setItemPrice(resolvedPrice)
                    }
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all text-sm font-black uppercase tracking-wider ${
                  formData.movement_type === type
                    ? 'border-calmar-ocean bg-calmar-ocean/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {type === 'sample' ? 'Muestra' :
                 type === 'consignment' ? 'Consignación' :
                 type === 'sale_invoice' ? 'Venta Factura' : 
                 type === 'sale_credit' ? 'Venta Crédito' : 'Venta Boleta'}
              </button>
            ))}
          </div>
        </div>

        {/* Client Selection */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
            Cliente / Prospecto
          </label>
          
          {/* Option for anonymous sample (only for sample type) */}
          {formData.movement_type === 'sample' && (
            <div className="mb-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-calmar-ocean/50 group"
                style={{
                  borderColor: isAnonymousSample ? '#1d504b' : '#e2e8f0',
                  backgroundColor: isAnonymousSample ? 'rgba(29, 80, 75, 0.05)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymousSample}
                  onChange={(e) => {
                    setIsAnonymousSample(e.target.checked)
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, prospect_id: '' }))
                    } else {
                      setFormData(prev => ({ ...prev, sample_recipient_name: '', sample_event_context: '' }))
                    }
                  }}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-calmar-ocean focus:ring-calmar-ocean"
                />
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="font-bold text-sm text-slate-900">Muestra sin cliente asociado</span>
                    <p className="text-xs text-slate-500">Para entregas en ferias, eventos, demostraciones, etc.</p>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Anonymous sample fields */}
          {formData.movement_type === 'sample' && isAnonymousSample && (
            <div className="space-y-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nombre del receptor (opcional)
                </label>
                <Input
                  value={formData.sample_recipient_name}
                  onChange={(e) => setFormData({ ...formData, sample_recipient_name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Contexto / Evento
                </label>
                <Input
                  value={formData.sample_event_context}
                  onChange={(e) => setFormData({ ...formData, sample_event_context: e.target.value })}
                  placeholder="Ej: Feria Gastronómica 2026, Evento empresarial..."
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Option for anonymous boleta (only for sale_boleta type) */}
          {formData.movement_type === 'sale_boleta' && (
            <div className="mb-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-calmar-ocean/50 group"
                style={{
                  borderColor: isAnonymousBoleta ? '#1d504b' : '#e2e8f0',
                  backgroundColor: isAnonymousBoleta ? 'rgba(29, 80, 75, 0.05)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymousBoleta}
                  onChange={(e) => {
                    setIsAnonymousBoleta(e.target.checked)
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, prospect_id: '' }))
                    } else {
                      setFormData(prev => ({ ...prev, boleta_buyer_name: '' }))
                    }
                  }}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-calmar-ocean focus:ring-calmar-ocean"
                />
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="font-bold text-sm text-slate-900">Venta sin cliente asociado</span>
                    <p className="text-xs text-slate-500">Venta rápida sin registrar en cuenta de cliente</p>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Anonymous boleta fields */}
          {formData.movement_type === 'sale_boleta' && isAnonymousBoleta && (
            <div className="space-y-4 p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nombre del Comprador (Opcional)
                </label>
                <Input
                  value={formData.boleta_buyer_name || ''}
                  onChange={(e) => setFormData({ ...formData, boleta_buyer_name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Client/Prospect selectors (hidden when anonymous sample or boleta) */}
          {!(formData.movement_type === 'sample' && isAnonymousSample) && !(formData.movement_type === 'sale_boleta' && isAnonymousBoleta) && (
            <div className="space-y-4">
              {isLoadingClients ? (
                <div className="py-4 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-calmar-ocean border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-xs text-slate-500 mt-2">Cargando clientes...</p>
                </div>
              ) : (
                <>
                  {/* Prospect Selector */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      <Users className="w-4 h-4" />
                      Prospecto
                    </label>
                    <select
                      value={formData.prospect_id}
                      onChange={(e) => {
                        void handleProspectSelection(e.target.value)
                      }}
                      className={`w-full px-3 py-2 rounded-lg border-2 focus:border-calmar-ocean focus:outline-none text-sm ${
                        formData.prospect_id 
                          ? 'border-emerald-300 bg-emerald-50' 
                          : 'border-slate-200'
                      }`}
                    >
                      <option value="">Seleccionar prospecto...</option>
                      {prospects.map(prospect => {
                        const displayName = prospect.fantasy_name || prospect.company_name || prospect.contact_name
                        return (
                          <option key={prospect.id} value={prospect.id}>
                            {displayName} - {prospect.type.toUpperCase()}
                            {prospect.converted_to_type === 'b2b' ? ' ✓ B2B' : ''}
                          </option>
                        )
                      })}
                    </select>
                    {prospects.length === 0 && (
                      <p className="text-xs text-slate-500 mt-1">No hay prospectos disponibles</p>
                    )}
                  </div>

                  {/* Clear selection button */}
                  {formData.prospect_id && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleProspectSelection('')
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider"
                    >
                      × Limpiar selección
                    </button>
                  )}

                  {/* Credit Limit Display */}
                  {formData.movement_type === 'consignment' && formData.prospect_id && (
                    <div className={`mt-2 p-3 rounded-lg border flex items-center justify-between ${
                      totalAmount > prospectCreditLimit 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-bold">Crédito Disponible:</span>
                      </div>
                      <span className="text-lg font-black">
                        ${prospectCreditLimit.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">Productos</h2>
          
          {/* Add Product Form */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Producto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value)
                  setSelectedVariant('')
                  const product = products.find(p => p.id === e.target.value)
                  if (product) {
                    if (formData.movement_type === 'sample') {
                      setItemPrice(0)
                    } else {
                      const fixedPrice = prospectPrices.get(product.id)
                      const resolvedPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
                        ? fixedPrice
                        : Number(product.base_price)
                      setItemPrice(resolvedPrice)
                    }
                  }
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
            
            {selectedProductData?.variants && selectedProductData.variants.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Variante
                </label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                >
                  <option value="">Sin variante</option>
                  {selectedProductData.variants.map((variant: any) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cantidad
              </label>
              <Input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                className="h-10"
              />
            </div>
            
            {formData.movement_type !== 'sample' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Precio Unit.
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                  className={`h-10 ${isProspectPrice ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : ''}`}
                />
                {isProspectPrice && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] leading-tight">
                    <span className="text-emerald-600 font-bold uppercase tracking-wider">
                      Precio prospecto
                    </span>
                    {basePrice > 0 && (
                      <span className="text-slate-400 line-through">
                        Base: ${basePrice.toLocaleString('es-CL')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className={`flex items-end ${formData.movement_type === 'sample' ? 'col-span-2' : ''}`}>
              <Button
                type="button"
                onClick={handleAddItem}
                className="w-full uppercase font-black tracking-wider"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-2 mb-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900">
                      {item.product_name} {item.variant_name && `- ${item.variant_name}`}
                    </p>
                    <p className="text-xs text-slate-600">
                      {formData.movement_type === 'sample' ? (
                        <span className="font-bold text-emerald-600">GRATIS</span>
                      ) : (
                        `${item.quantity} x $${item.unit_price.toLocaleString('es-CL')} = $${(item.quantity * item.unit_price).toLocaleString('es-CL')}`
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Total:
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {formData.movement_type === 'sample' ? 'GRATIS' : `$${totalAmount.toLocaleString('es-CL')}`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">Fechas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.movement_type === 'sale_credit' || formData.movement_type === 'consignment') && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="h-10"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Fecha de Entrega
              </label>
              <Input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Información adicional sobre el movimiento..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/crm/movements" className="flex-1">
            <Button type="button" variant="outline" className="w-full uppercase font-black tracking-wider">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="flex-1 uppercase font-black tracking-wider"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Crear Movimiento'}
          </Button>
        </div>
      </form>
    </div>
  )
}
