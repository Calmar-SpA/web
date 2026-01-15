
import { createClient } from '@/lib/supabase/server'
import { OrderService } from '@calmar/database'
import { Button, Card, CardContent } from "@calmar/ui"
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react"
import { Link } from '@/navigation'
import { redirect } from 'next/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'

import { getTranslations } from 'next-intl/server'

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Account.ordersList")
  
  const statusMap: Record<string, { icon: any; color: string }> = {
    pending_payment: { icon: Clock, color: 'text-amber-500 bg-amber-50' },
    paid: { icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
    processing: { icon: Package, color: 'text-blue-500 bg-blue-50' },
    shipped: { icon: Truck, color: 'text-purple-500 bg-purple-50' },
    delivered: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
    cancelled: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
    return null // TypeScript might need this to know execution stops here if redirect type isn't verified as never in this context
  }

  const orderService = new OrderService(supabase)
  const orders = await orderService.getOrdersByUser(user.id)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-calmar-ocean/10 via-white to-calmar-mint/10 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("title")}</h1>
            <p className="text-slate-500 text-sm">{t("subtitle")}</p>
          </div>
          <Link href="/shop">
            <Button variant="outline" className="font-bold border-2 text-xs uppercase tracking-widest">
              {t("goToShop")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="border-dashed border-2 py-12 bg-white">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-calmar-ocean/10 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-calmar-ocean/50" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{t("empty.title")}</p>
                <p className="text-sm text-slate-500">{t("empty.description")}</p>
              </div>
              <Link href="/shop">
                <Button className="bg-slate-900 hover:bg-calmar-ocean text-white font-black">
                  {t("empty.button")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          orders.map((order: any) => {
            const statusConfig = statusMap[order.status] || { icon: Clock, color: 'text-slate-500 bg-slate-50' }
            const StatusIcon = statusConfig.icon
            const statusLabel = t(`status.${order.status}`)

            const { net, iva } = getPriceBreakdown(order.total_amount)
            return (
              <Card key={order.id} className="group hover:border-calmar-ocean/30 transition-all overflow-hidden bg-white shadow-sm">
                <Link href={`/account/orders/${order.id}`}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.color}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-lg uppercase">{t("orderNumber", { number: order.id.slice(0, 8) })}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {t("date", { 
                            date: new Date(order.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            }),
                            count: order.order_items.length
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("total")}</p>
                        <p className="font-black text-xl text-calmar-ocean">
                          ${formatClp(order.total_amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">IVA incluido</p>
                        <p className="text-[10px] text-slate-400">
                          {`Neto: $${formatClp(net)} · IVA (19%): $${formatClp(iva)}`}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-calmar-ocean transition-colors" />
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
