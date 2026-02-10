import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ImageIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { ProductHistory, HistoryItem } from './product-history'

export default async function ProductInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: productId } = await params

  // 1. Get Product & Inventory
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory (quantity)
    `)
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-red-600">Producto no encontrado</h1>
        <p className="text-slate-500 mt-2">ID: {productId}</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 text-xs font-mono rounded text-left max-w-lg mx-auto overflow-auto">
            {JSON.stringify(error, null, 2)}
          </div>
        )}
        <Link href="/inventory">
          <Button className="mt-6">Volver al inventario</Button>
        </Link>
      </div>
    )
  }

  const currentStock = product.inventory?.[0]?.quantity || 0

  // 2. Get Stock Entries (Ingresos)
  const { data: entries } = await supabase
    .from('stock_entries')
    .select('*, suppliers(name)')
    .eq('product_id', productId)
    .order('entry_date', { ascending: false })

  // 3. Get Product Movements (Salidas CRM)
  // First get movements without complex joins to avoid silent errors
  const { data: allMovements, error: movError } = await supabase
    .from('product_movements')
    .select(`
      *,
      prospect:prospects(company_name, contact_name, fantasy_name)
    `)
    .order('created_at', { ascending: false })

  if (movError) {
    console.error('Error fetching movements:', movError)
  }

  // Filter movements that contain this product in their items array
  const movements = (allMovements || []).filter((m: any) => {
    const items = Array.isArray(m.items) ? m.items : []
    return items.some((i: any) => i.product_id === productId)
  })

  // Fetch customer/b2b data separately for matching movements to avoid join issues
  const movementIds = movements.map(m => m.id)
  let customersMap: Record<string, any> = {}
  let b2bMap: Record<string, any> = {}

  if (movements.length > 0) {
    // Get customers for movements that have customer_user_id
    const customerUserIds = movements.map(m => m.customer_user_id).filter(Boolean)
    if (customerUserIds.length > 0) {
      const { data: customers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', customerUserIds)
      customers?.forEach(c => { customersMap[c.id] = c })
    }

    // Get b2b clients for movements that have b2b_client_id
    const b2bIds = movements.map(m => m.b2b_client_id).filter(Boolean)
    if (b2bIds.length > 0) {
      const { data: b2bClients } = await supabase
        .from('b2b_clients')
        .select('id, company_name')
        .in('id', b2bIds)
      b2bClients?.forEach(b => { b2bMap[b.id] = b })
    }
  }

  // 4. Get Web Orders (Salidas Web)
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      quantity,
      order:orders (
        id,
        order_number,
        created_at,
        status,
        user:users(full_name, email)
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  // Process History
  const history: HistoryItem[] = []

  // Add Entries
  entries?.forEach((entry: any) => {
    history.push({
      id: entry.id,
      date: entry.entry_date,
      type: 'entry',
      quantity: entry.quantity,
      recipient: entry.suppliers?.name || 'Proveedor Desconocido',
      status: 'Completado',
      reference: entry.invoice_number || '-',
      url: `/inventory/${entry.id}/edit`
    })
  })

  // Add Movements
  movements?.forEach((m: any) => {
    // Find quantity for this product in items
    const item = (m.items as any[]).find((i: any) => i.product_id === productId)
    if (!item) return

    let recipient = 'Desconocido'
    if (m.sample_recipient_name) {
      recipient = `${m.sample_recipient_name}${m.sample_event_context ? ` (${m.sample_event_context})` : ''}`
    } else if (m.prospect) {
      const p = Array.isArray(m.prospect) ? m.prospect[0] : m.prospect
      recipient = p?.fantasy_name || p?.company_name || p?.contact_name || 'Prospecto'
    } else if (m.b2b_client_id && b2bMap[m.b2b_client_id]) {
      recipient = b2bMap[m.b2b_client_id].company_name || 'Cliente B2B'
    } else if (m.customer_user_id && customersMap[m.customer_user_id]) {
      const c = customersMap[m.customer_user_id]
      recipient = c.full_name || c.email || 'Cliente'
    }

    history.push({
      id: m.id,
      date: m.created_at,
      type: m.movement_type as any,
      quantity: Number(item.quantity),
      recipient,
      status: m.status,
      reference: m.movement_number || '-',
      url: `/crm/movements/${m.id}`
    })
  })

  // Add Orders
  orderItems?.forEach((item: any) => {
    if (!item.order) return
    const order = Array.isArray(item.order) ? item.order[0] : item.order
    const user = order.user ? (Array.isArray(order.user) ? order.user[0] : order.user) : null

    history.push({
      id: order.id, 
      date: order.created_at,
      type: 'web_order',
      quantity: item.quantity,
      recipient: user?.full_name || user?.email || 'Cliente Web',
      status: order.status,
      reference: order.order_number,
      url: `/orders/${order.id}`
    })
  })

  // Sort by date desc
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate totals
  const totalIn = entries?.reduce((sum: number, e: any) => sum + e.quantity, 0) || 0
  
  // Total out: movements (excluding returned?) + orders
  // For simplicity, sum all non-entry types
  const totalOut = history
    .filter(h => h.type !== 'entry' && h.status !== 'returned' && h.status !== 'cancelled')
    .reduce((sum, h) => sum + h.quantity, 0)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
            Historial de Producto
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Movimientos detallados e inventario
          </p>
        </div>
      </div>

      {/* Product Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-calmar-ocean/10 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 h-48 bg-slate-50 flex items-center justify-center border-r border-slate-100">
              {product.image_url ? (
                <div className="relative w-32 h-32">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <ImageIcon className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                {product.sku}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">
                {product.name}
              </h2>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Stock Actual
                  </div>
                  <div className={`text-2xl font-black ${currentStock < 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {currentStock}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Total Ingresado
                  </div>
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    {totalIn}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Total Salidas
                  </div>
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    {totalOut}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats / Info */}
        <Card className="border-calmar-ocean/10 shadow-sm p-6">
          <h3 className="font-black uppercase tracking-tight text-slate-900 mb-4">
            Información
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Precio Base</span>
              <span className="font-bold">${product.base_price?.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Unidades por Pack</span>
              <span className="font-bold">{product.units_per_pack || 1}</span>
            </div>
             <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Estado</span>
              <span className={`font-bold ${product.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                {product.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductHistory history={history} />
        </CardContent>
      </Card>
    </div>
  )
}
