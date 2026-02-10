"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { OrderService } from "@calmar/database"
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, ChevronLeft, MapPin, CreditCard, Receipt, Truck, Trash2, Gift, Store, User, Building2 } from "lucide-react"
import Link from "next/link"
import { updateOrderStatus, deleteOrder } from "../actions"
import { toast } from "sonner"
import { formatClp, getPriceBreakdown } from "@calmar/utils"
import { useRouter } from "next/navigation"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este pedido? Se reajustará el stock automáticamente. Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    try {
      const result = await deleteOrder(id)
      if (result.success) {
        toast.success('Pedido eliminado correctamente')
        router.push('/orders')
      } else {
        toast.error('Error al eliminar pedido: ' + result.error)
        setDeleting(false)
      }
    } catch (error) {
      toast.error('Error al eliminar pedido')
      setDeleting(false)
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

  const { net: totalNet, iva: totalIva } = getPriceBreakdown(order.total_amount)

  // Payment details
  const payment = order.payments?.[0]
  const paymentMethod = payment?.metadata?.paymentData?.media || payment?.payment_method || 'N/A'
  const paymentProvider = payment?.payment_provider === 'internal_credit' 
    ? 'Crédito B2B' 
    : payment?.payment_provider === 'manual_admin' 
      ? 'Manual (Admin)' 
      : 'Flow (Chile)'

  // Discount details
  const discountCode = order.discount_code
  const discountCodeAmount = order.discount_usage?.[0]?.discount_applied || 0
  const totalDiscount = order.discount_amount || 0
  const newsletterDiscount = Math.max(0, totalDiscount - discountCodeAmount)

  // Points details
  const pointsRedeemed = order.points_redeemed || 0
  const pointsEarned = order.points_earned || 0
  
  // Calculate real subtotal (before discounts)
  const subtotal = order.subtotal || order.total_amount + totalDiscount + pointsRedeemed - order.shipping_cost

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/orders" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver al listado
        </Link>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={updating || deleting}
            onClick={handleDelete}
            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[10px] font-bold uppercase tracking-tighter"
          >
            {deleting ? (
              <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full mr-2" />
            ) : (
              <Trash2 className="w-3 h-3 mr-2" />
            )}
            Eliminar Pedido
          </Button>
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase">Pedido #{order.id.slice(0, 8)}</h1>
            {order.is_business_order ? (
              <div className="bg-slate-900 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Empresa</span>
              </div>
            ) : (
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Personal</span>
              </div>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Cliente: <span className="font-bold text-slate-900">{order.customer_name}</span> • {new Date(order.created_at).toLocaleString('es-CL')}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{order.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total Pedido</p>
          <p className="text-3xl font-black text-calmar-ocean">
            ${formatClp(order.total_amount)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">IVA incluido</p>
          <p className="text-[10px] text-slate-400">
            {`Neto: $${formatClp(totalNet)} · IVA (19%): $${formatClp(totalIva)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-calmar-ocean" />
                Lineas de Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {order.order_items.map((item: any) => {
                  const lineTotal = item.unit_price * item.quantity
                  const { net: unitNet, iva: unitIva } = getPriceBreakdown(item.unit_price)
                  const { net: lineNet, iva: lineIva } = getPriceBreakdown(lineTotal)
                  return (
                    <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                      {item.products?.image_url ? (
                        <img 
                          src={item.products.image_url}
                          alt={item.products?.name || 'Producto'}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold">{item.products?.name || item.product_name || 'Producto'}</h4>
                        <p className="text-xs text-slate-500">
                          Cantidad: {item.quantity} • Unitario: ${formatClp(item.unit_price)}
                        </p>
                        <p className="text-[10px] text-slate-400">IVA incluido</p>
                        <p className="text-[10px] text-slate-400">
                          {`Neto: $${formatClp(unitNet)} · IVA (19%): $${formatClp(unitIva)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">
                          ${formatClp(lineTotal)}
                        </p>
                        <p className="text-[10px] text-slate-400">IVA incluido</p>
                        <p className="text-[10px] text-slate-400">
                          {`Neto: $${formatClp(lineNet)} · IVA (19%): $${formatClp(lineIva)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Discounts & Points Info (if applicable) */}
          {(totalDiscount > 0 || pointsRedeemed > 0 || pointsEarned > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(totalDiscount > 0) && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-calmar-ocean">
                      <Gift className="w-5 h-5" />
                      <h3 className="font-bold uppercase">Descuentos</h3>
                    </div>
                    <div className="text-sm space-y-2">
                      {discountCode && (
                        <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-100">
                          <div>
                            <p className="font-bold text-green-700">CUPÓN: {discountCode.code}</p>
                            <p className="text-[10px] text-green-600">{discountCode.name}</p>
                          </div>
                          <span className="font-bold text-green-700">-${formatClp(discountCodeAmount)}</span>
                        </div>
                      )}
                      
                      {newsletterDiscount > 0 && (
                        <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                          <p className="font-bold text-blue-700">Descuento Newsletter</p>
                          <span className="font-bold text-blue-700">-${formatClp(newsletterDiscount)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(pointsRedeemed > 0 || pointsEarned > 0) && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-calmar-ocean">
                      <Store className="w-5 h-5" />
                      <h3 className="font-bold uppercase">Puntos Calmar</h3>
                    </div>
                    <div className="text-sm space-y-2">
                      {pointsRedeemed > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Puntos canjeados</span>
                          <span className="font-bold text-red-500">-{pointsRedeemed} pts</span>
                        </div>
                      )}
                      {pointsEarned > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Puntos ganados</span>
                          <span className="font-bold text-green-500">+{pointsEarned} pts</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900 text-white">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-calmar-mint" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-bold">${formatClp(subtotal)}</span>
                </div>
                
                {discountCodeAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Cupón ({discountCode?.code})</span>
                    <span>-${formatClp(discountCodeAmount)}</span>
                  </div>
                )}

                {newsletterDiscount > 0 && (
                  <div className="flex justify-between text-sm text-blue-400">
                    <span>Newsletter</span>
                    <span>-${formatClp(newsletterDiscount)}</span>
                  </div>
                )}

                {pointsRedeemed > 0 && (
                  <div className="flex justify-between text-sm text-calmar-mint">
                    <span>Puntos canjeados</span>
                    <span>-${formatClp(pointsRedeemed)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm pt-2">
                  <span className="text-slate-400">Envío</span>
                  <span className={`font-bold ${order.shipping_cost > 0 ? 'text-white' : 'text-calmar-mint'}`}>
                    {order.shipping_cost > 0 ? `$${formatClp(order.shipping_cost)}` : 'Gratis'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between text-xl uppercase">
                <span className="font-black">Total</span>
                <span className="font-black text-calmar-mint">${formatClp(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-tight flex items-center gap-2">
                <Truck className="w-4 h-4 text-calmar-ocean" />
                Información de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</p>
                <p className="text-sm font-medium">{order.shipping_address?.name || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RUT</p>
                <p className="text-sm font-medium">{order.shipping_address?.rut || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direccion</p>
                <p className="text-sm font-medium">{order.shipping_address?.address || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comuna</p>
                <p className="text-sm font-medium">{order.shipping_address?.comuna || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Region</p>
                <p className="text-sm font-medium">{order.shipping_address?.region || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacto</p>
                <p className="text-sm font-medium">{order.customer_email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-calmar-ocean" />
                Pago & Transacción
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</p>
                <p className="text-sm font-medium">{paymentProvider}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Método</p>
                <p className="text-sm font-medium capitalize">{paymentMethod}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Transacción</p>
                <p className="text-xs font-mono break-all">{payment?.provider_transaction_id || order.payments?.[0]?.provider_transaction_id || 'N/A'}</p>
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