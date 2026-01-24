import { createClient } from '@/lib/supabase/server'
import { OrderService, UnifiedOrderItem } from '@calmar/database'
import { Button, Card, CardContent } from "@calmar/ui"
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle, Gift, FileText, CreditCard, Store } from "lucide-react"
import { Link } from '@/navigation'
import { redirect } from 'next/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import { getTranslations } from 'next-intl/server'

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Account.ordersList")
  
  // Status icons and colors for orders
  const statusMap: Record<string, { icon: any; color: string }> = {
    pending_payment: { icon: Clock, color: 'text-amber-500 bg-amber-50' },
    pending: { icon: Clock, color: 'text-amber-500 bg-amber-50' },
    paid: { icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
    processing: { icon: Package, color: 'text-blue-500 bg-blue-50' },
    shipped: { icon: Truck, color: 'text-purple-500 bg-purple-50' },
    delivered: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
    cancelled: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
    returned: { icon: AlertCircle, color: 'text-orange-500 bg-orange-50' },
    sold: { icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
    partial_paid: { icon: Clock, color: 'text-amber-500 bg-amber-50' },
    overdue: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
  }

  // Type badges for different record types
  const typeBadges: Record<string, { label: string; icon: any; color: string }> = {
    online: { label: t('types.online'), icon: Store, color: 'bg-calmar-ocean/10 text-calmar-ocean' },
    sample: { label: t('types.sample'), icon: Gift, color: 'bg-pink-100 text-pink-700' },
    consignment: { label: t('types.consignment'), icon: Package, color: 'bg-purple-100 text-purple-700' },
    sale_invoice: { label: t('types.saleInvoice'), icon: FileText, color: 'bg-blue-100 text-blue-700' },
    sale_credit: { label: t('types.saleCredit'), icon: CreditCard, color: 'bg-amber-100 text-amber-700' },
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
    return null
  }

  const orderService = new OrderService(supabase)
  
  let unifiedOrders: UnifiedOrderItem[] = []
  try {
    unifiedOrders = await orderService.getUnifiedOrdersForUser(user.id)
  } catch (error) {
    console.error('Error fetching unified orders:', error)
  }

  const onlineOrders = unifiedOrders.filter(o => o.type === 'online')
  const businessOrders = unifiedOrders.filter(o => o.type !== 'online')

  return (
    <div className="space-y-8">
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

      <div className="space-y-10">
        {/* Compras Personales */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="h-6 w-1 bg-calmar-primary rounded-full"></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Compras Personales</h2>
          </div>
          
          <div className="space-y-4">
            {onlineOrders.length === 0 ? (
              <Card className="border-dashed border-2 py-8 bg-white/50">
                <CardContent className="flex flex-col items-center justify-center text-center py-4">
                  <p className="text-sm text-slate-400 font-medium">No tienes compras personales aún.</p>
                </CardContent>
              </Card>
            ) : (
              onlineOrders.map((item) => <OrderCard key={item.id} item={item} t={t} locale={locale} statusMap={statusMap} typeBadges={typeBadges} />)
            )}
          </div>
        </section>

        {/* Movimientos de Empresa */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Movimientos de Empresa</h2>
          </div>

          <div className="space-y-4">
            {businessOrders.length === 0 ? (
              <Card className="border-dashed border-2 py-8 bg-white/50">
                <CardContent className="flex flex-col items-center justify-center text-center py-4">
                  <p className="text-sm text-slate-400 font-medium">No hay movimientos registrados para tu empresa.</p>
                </CardContent>
              </Card>
            ) : (
              businessOrders.map((item) => <OrderCard key={item.id} item={item} t={t} locale={locale} statusMap={statusMap} typeBadges={typeBadges} />)
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function OrderCard({ item, t, locale, statusMap, typeBadges }: { item: UnifiedOrderItem, t: any, locale: string, statusMap: any, typeBadges: any }) {
  const statusConfig = statusMap[item.status] || { icon: Clock, color: 'text-slate-500 bg-slate-50' }
  const StatusIcon = statusConfig.icon
  const statusLabel = t(`status.${item.status}`)
  const typeBadge = typeBadges[item.type] || typeBadges.online
  const TypeIcon = typeBadge.icon

  const { net, iva } = getPriceBreakdown(item.total_amount)
  
  const detailLink = item.source === 'order' 
    ? `/account/orders/${item.id}` 
    : `/account/orders/m/${item.id}`

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.remaining_balance > 0

  return (
    <Card 
      className={`group hover:border-calmar-ocean/30 transition-all overflow-hidden bg-white shadow-sm ${isOverdue ? 'border-red-200' : ''}`}
    >
      <Link href={detailLink}>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.color}`}>
                <StatusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-sm sm:text-lg uppercase truncate">
                    {item.reference_number || `#${item.id.slice(0, 8)}`}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${typeBadge.color}`}>
                    <TypeIcon className="w-3 h-3" />
                    {typeBadge.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                    {statusLabel}
                  </span>
                  {isOverdue && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {t('status.overdue')}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                  {new Date(item.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                  {item.items_count > 0 && ` · ${item.items_count} ${item.items_count === 1 ? t('product') : t('products')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{t("total")}</p>
                <p className="font-black text-lg sm:text-xl text-calmar-ocean">
                  ${formatClp(item.total_amount)}
                </p>
                {item.remaining_balance > 0 && item.type !== 'sample' && (
                  <p className={`text-[10px] sm:text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                    {t('pendingPayment')}: ${formatClp(item.remaining_balance)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.invoice_url && (
                  <FileText className="w-4 h-4 text-slate-400" title={t('hasInvoice')} />
                )}
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-calmar-ocean transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}
