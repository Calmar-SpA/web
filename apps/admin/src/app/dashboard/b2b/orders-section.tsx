'use client'

import { useState, useEffect } from 'react'
import { Button, Skeleton } from '@calmar/ui'
import { ShoppingBag, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { getB2BClientOrders } from './actions'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  status: string
}

interface OrdersSectionProps {
  userId: string | null
}

export function OrdersSection({ userId }: OrdersSectionProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isExpanded && userId && orders.length === 0) {
      loadOrders()
    }
  }, [isExpanded, userId])

  const loadOrders = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const data = await getB2BClientOrders(userId)
      setOrders(data as Order[])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!userId) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending_payment':
      case 'processing':
        return 'bg-amber-100 text-amber-700'
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <Button
        variant="ghost"
        className="w-full flex justify-between items-center py-2 px-0 hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <ShoppingBag className="h-4 w-4" />
          Historial de Pedidos
          {orders.length > 0 && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-1">{orders.length}</span>}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </Button>

      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Este cliente no tiene pedidos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-2">Orden</th>
                    <th className="py-3 px-2">Fecha</th>
                    <th className="py-3 px-2">Total</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-900">#{order.order_number}</td>
                      <td className="py-3 px-2 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2 font-bold text-slate-900">${Number(order.total_amount).toLocaleString('es-CL')}</td>
                      <td className="py-3 px-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-calmar-ocean">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
