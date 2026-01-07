"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { OrderService } from "@calmar/database"
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, ChevronLeft, MapPin, CreditCard, Receipt, Truck } from "lucide-react"
import Link from "next/link"
import { updateOrderStatus } from "../actions"
import { toast } from "sonner"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const supabase = createClient()
  const orderService = new OrderService(supabase)

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await orderService.getOrderById(id)
        setOrder(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id])

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true)
    try {
      await updateOrderStatus(id, newStatus)
      setOrder({ ...order, status: newStatus })
      toast.success(`Pedido actualizado a ${newStatus}`)
    } catch (error) {
      toast.error("Error al actualizar estado")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (!order) return <div className="p-8">Pedido no encontrado</div>

  const statusOptions = [
    { value: "pending_payment", label: "Pago Pendiente", color: "bg-amber-500" },
    { value: "paid", label: "Pagado", color: "bg-green-500" },
    { value: "processing", label: "Procesando", color: "bg-blue-500" },
    { value: "shipped", label: "Enviado", color: "bg-purple-500" },
    { value: "delivered", label: "Entregado", color: "bg-emerald-500" },
    { value: "cancelled", label: "Cancelado", color: "bg-red-500" },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/orders" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver al listado
        </Link>
        <div className="flex gap-2">
          {statusOptions.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              disabled={updating || order.status === opt.value}
              onClick={() => handleStatusUpdate(opt.value)}
              className={`${order.status === opt.value ? opt.color : "bg-slate-100 text-slate-600 hover:bg-slate-200"} text-[10px] font-bold uppercase tracking-tighter`}
            >
              Marcar como {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Pedido #{order.id.slice(0, 8)}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Cliente: <span className="font-bold text-slate-900">{order.customer_name}</span> • {new Date(order.created_at).toLocaleString('es-CL')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total Pedido</p>
          <p className="text-3xl font-black italic text-calmar-ocean">
            ${order.total_amount.toLocaleString('es-CL')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg italic uppercase tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-calmar-ocean" />
                Lineas de Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                      <img 
                        src="C:/Users/felip/.gemini/antigravity/brain/04bc3b89-36f7-4e81-9e30-2d86782a2e82/uploaded_image_0_1767715376929.png" 
                        alt={item.products.name}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{item.products.name}</h4>
                        <p className="text-xs text-slate-500">Cantidad: {item.quantity} • Unitario: ${item.unit_price.toLocaleString('es-CL')}</p>
                      </div>
                      <p className="font-black italic text-slate-900">
                        ${(item.unit_price * item.quantity).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-sm italic uppercase tracking-tight flex items-center gap-2">
                <Truck className="w-4 h-4 text-calmar-ocean" />
                Información de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección</p>
                <p className="text-sm font-medium">{order.shipping_address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacto</p>
                <p className="text-sm font-medium">{order.customer_email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-sm italic uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-calmar-ocean" />
                Pago & Transacción
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token Flow</p>
                <p className="text-xs font-mono break-all">{order.payments?.[0]?.provider_transaction_id || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Pago</p>
                <p className="text-sm font-bold text-calmar-ocean uppercase">{order.payments?.[0]?.status || 'pending'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
