import { createClient } from '@/lib/supabase/server'
import { OrderService } from '@calmar/database'
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, ChevronLeft, MapPin, CreditCard, Receipt } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from 'next/navigation'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orderService = new OrderService(supabase)
  const order = await orderService.getOrderById(id)

  if (!order || order.user_id !== user.id) {
    notFound()
  }

  const steps = [
    { key: 'pending_payment', label: 'Pago Pendiente' },
    { key: 'paid', label: 'Pagado' },
    { key: 'processing', label: 'En Preparación' },
    { key: 'shipped', label: 'En camino' },
    { key: 'delivered', label: 'Entregado' },
  ]

  const currentStep = steps.findIndex(s => s.key === order.status)

  return (
    <div className="w-[90%] max-w-4xl mx-auto py-12">
      <div className="mb-8">
        <Link href="/account/orders" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver a mis pedidos
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Pedido #{order.id.slice(0, 8)}</h1>
          <div className="bg-calmar-ocean text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            {order.status}
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-2">
          Realizado el {new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
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
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                      <img 
                        src="C:/Users/felip/.gemini/antigravity/brain/04bc3b89-36f7-4e81-9e30-2d86782a2e82/uploaded_image_0_1767715376929.png" 
                        alt={item.products.name}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold">{item.products.name}</h4>
                        <p className="text-xs text-slate-500">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-black text-calmar-ocean">
                        ${(item.unit_price * item.quantity).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                ))}
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
                  <p className="text-slate-500">Método: Flow (Chile)</p>
                  <p className="text-slate-500">Estado: {order.status === 'paid' ? 'Completado' : order.status}</p>
                  {order.payments?.[0] && (
                    <p className="text-[10px] font-mono text-slate-400 mt-2 uppercase">Trans: {order.payments[0].provider_transaction_id}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <span className="font-bold">${order.total_amount.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Envío</span>
                  <span className="font-bold text-calmar-mint">Gratis</span>
                </div>
              </div>
              <div className="flex justify-between text-xl uppercase">
                <span className="font-black">Total</span>
                <span className="font-black text-calmar-mint">${order.total_amount.toLocaleString('es-CL')}</span>
              </div>
              
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
