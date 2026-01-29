'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderService } from '@calmar/database'
import { Button, Card, CardContent } from "@calmar/ui"
import { Package, Eye, MoreVertical, Plus, Building2, User, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { formatClp, getPriceBreakdown } from "@calmar/utils"

const TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  personal_order: { label: 'Personal', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: User },
  business_order: { label: 'Empresa (Web)', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Building2 },
  sale_invoice: { label: 'Venta Factura', color: 'bg-green-100 text-green-700 border-green-200', icon: Package },
  sale_credit: { label: 'Venta Crédito', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Package },
  consignment: { label: 'Consignación', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Package }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'personal' | 'business'>('all')

  useEffect(() => {
    loadOrders()
  }, [filter])

  const loadOrders = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const orderService = new OrderService(supabase)
    
    try {
      const data = await orderService.getAllOrdersUnified({ type: filter })
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-950">Gestión de Pedidos</h1>
          <p className="text-slate-700 font-medium">Administra y procesa las ventas de Calmar.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders/new">
            <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Pedido
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('personal')}
          className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
            filter === 'personal'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          Personal
        </button>
        <button
          onClick={() => setFilter('business')}
          className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
            filter === 'business'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresa
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
                No hay pedidos
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                No se encontraron pedidos con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">ID Pedido</th>
                    <th className="px-6 py-4 font-bold">Tipo</th>
                    <th className="px-6 py-4 font-bold">Fecha</th>
                    <th className="px-6 py-4 font-bold">Cliente</th>
                    <th className="px-6 py-4 font-bold">Total</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order: any) => {
                    const { net, iva } = getPriceBreakdown(order.total_amount)
                    const typeInfo = TYPE_LABELS[order.type] || TYPE_LABELS.personal_order
                    const TypeIcon = typeInfo.icon
                    const isMovement = order.source === 'movement'
                    const detailLink = isMovement ? `/crm/movements/${order.id}` : `/orders/${order.id}`
                    
                    return (
                      <tr key={`${order.source}-${order.id}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs font-black text-slate-900">
                          #{order.reference_number || order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex items-center gap-1.5 w-fit ${typeInfo.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {new Date(order.created_at).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-900">{order.customer_name}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase">{order.customer_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-900">
                            ${formatClp(order.total_amount)}
                          </div>
                          {!isMovement && (
                            <>
                              <div className="text-[10px] text-slate-400">IVA incluido</div>
                              <div className="text-[10px] text-slate-400">
                                {`Neto: $${formatClp(net)} · IVA (19%): $${formatClp(iva)}`}
                              </div>
                            </>
                          )}
                          {isMovement && order.remaining_balance > 0 && (
                            <div className="text-[10px] text-orange-600 font-bold">
                              Pendiente: ${formatClp(order.remaining_balance)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            order.status === 'paid' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 
                            order.status === 'pending_payment' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-900 border-green-200' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                            order.status === 'processing' ? 'bg-purple-100 text-purple-900 border-purple-200' :
                            'bg-slate-200 text-slate-900 border-slate-300'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={detailLink}>
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-calmar-ocean">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
