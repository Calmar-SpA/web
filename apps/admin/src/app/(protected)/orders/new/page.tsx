'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductService } from '@calmar/database'
import { createOrderForUser } from '../actions'
import { Button, Input } from '@calmar/ui'
import { ArrowLeft, Plus, X, Save, ShoppingBag, Package, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
  product_name?: string
}

interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  rut: string | null
}

export default function NewOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [userSearch, setUserSearch] = useState('')

  const [orderType, setOrderType] = useState<'web_order' | 'crm_movement'>('web_order')
  
  const [formData, setFormData] = useState({
    user_id: '',
    is_business_order: false,
    status: 'pending_payment' as 'pending_payment' | 'paid',
    notes: '',
    shipping_address: {
      name: '',
      rut: '',
      address: '',
      comuna: '',
      region: '',
      phone: ''
    }
  })

  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemPrice, setItemPrice] = useState(0)

  useEffect(() => {
    loadProducts()
    loadUsers()
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

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, rut')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  const handleAddItem = () => {
    if (!selectedProduct || itemQuantity <= 0 || itemPrice < 0) {
      toast.error('Selecciona un producto, cantidad y precio válidos')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const newItem: OrderItem = {
      product_id: selectedProduct,
      quantity: itemQuantity,
      unit_price: itemPrice,
      product_name: product.name
    }

    setItems([...items, newItem])
    setSelectedProduct('')
    setItemQuantity(1)
    setItemPrice(0)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  const handleUserSelection = (userId: string) => {
    setFormData(prev => ({ ...prev, user_id: userId }))
    
    const selectedUser = users.find(u => u.id === userId)
    if (selectedUser) {
      // Pre-fill shipping address with user data
      setFormData(prev => ({
        ...prev,
        shipping_address: {
          ...prev.shipping_address,
          name: selectedUser.full_name || selectedUser.email,
          rut: selectedUser.rut || '',
          phone: selectedUser.phone || ''
        }
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (orderType === 'crm_movement') {
      router.push('/crm/movements/new')
      return
    }

    if (!formData.user_id) {
      toast.error('Selecciona un usuario')
      return
    }

    if (items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    if (!formData.shipping_address.name || !formData.shipping_address.address || 
        !formData.shipping_address.comuna || !formData.shipping_address.region) {
      toast.error('Completa todos los campos de dirección de envío')
      return
    }

    setIsSubmitting(true)

    try {
      await createOrderForUser({
        user_id: formData.user_id,
        items: items,
        shipping_address: formData.shipping_address,
        is_business_order: formData.is_business_order,
        status: formData.status,
        notes: formData.notes || undefined
      })
      
      toast.success('Pedido creado exitosamente')
      router.push('/orders')
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.message || 'Error al crear pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (!userSearch) return true
    const search = userSearch.toLowerCase()
    return (
      user.email.toLowerCase().includes(search) ||
      user.full_name?.toLowerCase().includes(search) ||
      user.rut?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Nuevo <span className="text-calmar-ocean">Pedido</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Crear orden para un usuario o movimiento CRM
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type Selection */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
            Tipo de Pedido
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOrderType('web_order')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                orderType === 'web_order'
                  ? 'border-calmar-ocean bg-calmar-ocean/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <ShoppingBag className={`w-6 h-6 ${orderType === 'web_order' ? 'text-calmar-ocean' : 'text-slate-400'}`} />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-1">Orden Web</h3>
                  <p className="text-xs text-slate-600">
                    Crear una orden como si el usuario comprara en la web
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('crm_movement')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                orderType === 'crm_movement'
                  ? 'border-calmar-ocean bg-calmar-ocean/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Package className={`w-6 h-6 ${orderType === 'crm_movement' ? 'text-calmar-ocean' : 'text-slate-400'}`} />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-1">Movimiento CRM</h3>
                  <p className="text-xs text-slate-600">
                    Crear venta factura, crédito o consignación
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {orderType === 'web_order' && (
          <>
            {/* User Selection */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
                Seleccionar Usuario
              </label>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por email, nombre o RUT..."
                  className="pl-10 h-12"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {isLoadingUsers ? (
                <div className="py-4 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-calmar-ocean border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-xs text-slate-500 mt-2">Cargando usuarios...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserSelection(user.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        formData.user_id === user.id
                          ? 'border-calmar-ocean bg-calmar-ocean/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-bold text-sm">{user.full_name || user.email}</p>
                      <p className="text-xs text-slate-600">{user.email}</p>
                      {user.rut && <p className="text-xs text-slate-500">RUT: {user.rut}</p>}
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-slate-500 py-4">No se encontraron usuarios</p>
                  )}
                </div>
              )}
            </div>

            {/* Business Order Flag */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_business_order}
                  onChange={(e) => setFormData({ ...formData, is_business_order: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-calmar-ocean focus:ring-calmar-ocean"
                />
                <div>
                  <span className="font-bold text-sm text-slate-900">Orden de Empresa</span>
                  <p className="text-xs text-slate-500">Marcar si es una orden B2B/empresarial</p>
                </div>
              </label>
            </div>

            {/* Products */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Productos</h2>
              
              {/* Add Product Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Producto
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value)
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
                          {item.product_name}
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

            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">Dirección de Envío</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Nombre Completo *
                  </label>
                  <Input
                    value={formData.shipping_address.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, name: e.target.value }
                    })}
                    placeholder="Juan Pérez"
                    className="h-10"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    RUT
                  </label>
                  <Input
                    value={formData.shipping_address.rut}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, rut: e.target.value }
                    })}
                    placeholder="12.345.678-9"
                    className="h-10"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Dirección *
                  </label>
                  <Input
                    value={formData.shipping_address.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, address: e.target.value }
                    })}
                    placeholder="Av. Principal 123, Depto 456"
                    className="h-10"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Comuna *
                  </label>
                  <Input
                    value={formData.shipping_address.comuna}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, comuna: e.target.value }
                    })}
                    placeholder="Santiago"
                    className="h-10"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Región *
                  </label>
                  <Input
                    value={formData.shipping_address.region}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, region: e.target.value }
                    })}
                    placeholder="Región Metropolitana"
                    className="h-10"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    value={formData.shipping_address.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, phone: e.target.value }
                    })}
                    placeholder="+56 9 1234 5678"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
                Estado Inicial
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'pending_payment' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.status === 'pending_payment'
                      ? 'border-calmar-ocean bg-calmar-ocean/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm">Pago Pendiente</p>
                  <p className="text-xs text-slate-600">El usuario debe pagar</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'paid' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.status === 'paid'
                      ? 'border-calmar-ocean bg-calmar-ocean/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm">Pagado</p>
                  <p className="text-xs text-slate-600">Ya está pagado</p>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <label className="block text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
                Notas (Opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre el pedido..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-calmar-ocean focus:outline-none resize-none"
              />
            </div>
          </>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/orders" className="flex-1">
            <Button type="button" variant="outline" className="w-full uppercase font-black tracking-wider">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || (orderType === 'web_order' && (items.length === 0 || !formData.user_id))}
            className="flex-1 uppercase font-black tracking-wider"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Creando...' : orderType === 'web_order' ? 'Crear Pedido' : 'Ir a Movimientos CRM'}
          </Button>
        </div>
      </form>
    </div>
  )
}
