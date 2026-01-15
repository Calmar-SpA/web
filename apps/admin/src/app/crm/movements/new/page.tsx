'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductService, CRMService } from '@calmar/database'
import { createMovement } from '../../actions'
import { Button, Input } from '@calmar/ui'
import { ArrowLeft, Plus, X, Save } from 'lucide-react'
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
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [formData, setFormData] = useState({
    movement_type: defaultType as 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit',
    prospect_id: prospectId || '',
    b2b_client_id: '',
    customer_user_id: '',
    due_date: '',
    delivery_date: '',
    notes: ''
  })
  const [items, setItems] = useState<MovementItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemPrice, setItemPrice] = useState(0)

  useEffect(() => {
    loadProducts()
    loadProspects()
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

  const loadProspects = async () => {
    const supabase = createClient()
    const crmService = new CRMService(supabase)
    
    try {
      // Load prospects if prospect_id is provided
      if (prospectId) {
        const prospect = await crmService.getProspectById(prospectId)
        if (prospect) {
          setFormData(prev => ({ ...prev, prospect_id: prospectId }))
        }
      }
    } catch (error) {
      console.error('Error loading prospect:', error)
    }
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  const handleAddItem = () => {
    if (!selectedProduct || itemQuantity <= 0) {
      toast.error('Selecciona un producto y cantidad válida')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const variant = product.variants?.find((v: any) => v.id === selectedVariant)
    const unitPrice = itemPrice > 0 ? itemPrice : Number(product.base_price)

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
    
    if (items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    if (formData.movement_type !== 'sample' && !formData.prospect_id && !formData.b2b_client_id && !formData.customer_user_id) {
      toast.error('Selecciona un prospecto, cliente B2B o cliente')
      return
    }

    setIsSubmitting(true)

    try {
      await createMovement({
        movement_type: formData.movement_type,
        prospect_id: formData.prospect_id || null,
        b2b_client_id: formData.b2b_client_id || null,
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
        notes: formData.notes || undefined
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['sample', 'consignment', 'sale_invoice', 'sale_credit'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, movement_type: type })}
                className={`p-4 rounded-xl border-2 transition-all text-sm font-black uppercase tracking-wider ${
                  formData.movement_type === type
                    ? 'border-calmar-ocean bg-calmar-ocean/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {type === 'sample' ? 'Muestra' :
                 type === 'consignment' ? 'Consignación' :
                 type === 'sale_invoice' ? 'Venta Factura' : 'Venta Crédito'}
              </button>
            ))}
          </div>
        </div>

        {/* Client Selection */}
        {(formData.movement_type !== 'sample') && (
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
            <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
              Cliente / Prospecto
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Prospecto ID (opcional)
                </label>
                <Input
                  value={formData.prospect_id}
                  onChange={(e) => setFormData({ ...formData, prospect_id: e.target.value })}
                  placeholder="UUID del prospecto"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Cliente B2B ID (opcional)
                </label>
                <Input
                  value={formData.b2b_client_id}
                  onChange={(e) => setFormData({ ...formData, b2b_client_id: e.target.value })}
                  placeholder="UUID del cliente B2B"
                  className="h-10"
                />
              </div>
            </div>
          </div>
        )}

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
                    setItemPrice(Number(product.base_price))
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none text-sm"
                disabled={isLoadingProducts}
              >
                <option value="">Seleccionar...</option>
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
                className="h-10"
              />
            </div>
            
            <div className="flex items-end">
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
                      {item.quantity} x ${item.unit_price.toLocaleString('es-CL')} = ${(item.quantity * item.unit_price).toLocaleString('es-CL')}
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
                    ${totalAmount.toLocaleString('es-CL')}
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
