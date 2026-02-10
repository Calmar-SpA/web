import { createClient } from '@/lib/supabase/server'
import { OrderService } from '@calmar/database'
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, ChevronLeft, MapPin, CreditCard, Receipt, RefreshCw, Gift, Store, Building2, User } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from 'next/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import { syncOrderPaymentStatus } from './actions'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // First, sync payment status with Flow (in case callback didn't arrive)
  const syncResult = await syncOrderPaymentStatus(id)
  
  const orderService = new OrderService(supabase)
  const order = await orderService.getOrderById(id)

  if (!order || order.user_id !== user.id) {
    notFound()
  }
  
  // Use synced status if it was updated
  if (syncResult.wasUpdated) {
    order.status = syncResult.currentStatus
  }

  const steps = [
    { key: 'pending_payment', label: 'Pago Pendiente' },
    { key: 'paid', label: 'Pagado' },
    { key: 'processing', label: 'En Preparación' },
    { key: 'shipped', label: 'En camino' },
    { key: 'delivered', label: 'Entregado' },
  ]

  const currentStep = steps.findIndex(s => s.key === order.status)
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
    <div className="w-[90%] max-w-4xl mx-auto py-12">
      <div className="mb-8">
        <Link href="/account/orders" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver a mis pedidos
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
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
            <p className="text-slate-500 text-sm">
              Realizado el {new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-calmar-ocean text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest self-start md:self-center">
            {order.status}
          </div>
        </div>
        
        {syncResult.wasUpdated && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">
              El estado del pago ha sido actualizado automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      <div className="mb-12">
        <div className="relative flex justify-between">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-calmar-ocean -translate-y-1/2 z-0 transition-all duration-1000" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step, index) => (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 ${
                index <= currentStep ? 'bg-calmar-ocean text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {index <= currentStep ? (
                  <Package className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 hidden md:block ${
                index <= currentStep ? 'text-calmar-ocean' : 'text-slate-400'
              }`}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-calmar-ocean" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {order.order_items.map((item: any) => {
                  const lineTotal = item.unit_price * item.quantity
                  const { net: lineNet, iva: lineIva } = getPriceBreakdown(lineTotal)
                  return (
                  <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                      {item.products?.image_url ? (
                        <img 
                          src={item.products.image_url}
                          alt={item.products?.name || 'Producto'}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold">{item.products?.name || item.product_name || 'Producto'}</h4>
                        <p className="text-xs text-slate-500">Cantidad: {item.quantity}</p>
                      </div>
                      <div>
                        <p className="font-black text-calmar-ocean">
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

          {/* Shipping & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-calmar-ocean">
                  <MapPin className="w-5 h-5" />
                  <h3 className="font-bold uppercase">Despacho</h3>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-bold">{order.customer_name}</p>
                  {order.shipping_address && (
                    <>
                      <p className="text-slate-500">{order.shipping_address.address}</p>
                      <p className="text-slate-500">{order.shipping_address.comuna}, {order.shipping_address.region}</p>
                    </>
                  )}
                  <p className="text-slate-500">{order.customer_email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-calmar-ocean">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-bold uppercase">Pago</h3>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-slate-500">Proveedor: {paymentProvider}</p>
                  <p className="text-slate-500">Método: <span className="capitalize">{paymentMethod}</span></p>
                  <p className="text-slate-500">Estado: {order.status === 'paid' ? 'Completado' : order.status}</p>
                  {payment && (
                    <p className="text-[10px] font-mono text-slate-400 mt-2 uppercase break-all">
                      ID: {payment.provider_transaction_id || payment.id.slice(0, 8)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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

        {/* Totals */}
        <div className="lg:col-span-4">
          <Card className="bg-slate-900 text-white sticky top-32">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-calmar-mint" />
                Resumen
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
              <p className="text-[10px] text-slate-400 text-right">IVA incluido</p>
              <p className="text-[10px] text-slate-400 text-right">
                {`Neto: $${formatClp(totalNet)} · IVA (19%): $${formatClp(totalIva)}`}
              </p>
              
              {order.status === 'pending_payment' && (
                <Button className="w-full bg-calmar-ocean hover:bg-calmar-ocean-dark text-white font-black mt-4 h-12">
                  Completar pago
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
