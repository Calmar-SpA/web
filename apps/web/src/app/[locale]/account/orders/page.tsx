import { createClient } from '@/lib/supabase/server'
import { OrderService, UnifiedOrderItem } from '@calmar/database'
import { Button } from "@calmar/ui"
import { Link } from '@/navigation'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { OrdersList } from './orders-list'

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Account.ordersList")
  
  // Prepare translations as plain object for client component
  const translations = {
    types: {
      online: t('types.online'),
      sample: t('types.sample'),
      consignment: t('types.consignment'),
      saleInvoice: t('types.saleInvoice'),
      saleCredit: t('types.saleCredit'),
    },
    status: {
      pending_payment: t('status.pending_payment'),
      pending: t('status.pending'),
      paid: t('status.paid'),
      processing: t('status.processing'),
      shipped: t('status.shipped'),
      delivered: t('status.delivered'),
      cancelled: t('status.cancelled'),
      returned: t('status.returned'),
      sold: t('status.sold'),
      partial_paid: t('status.partial_paid'),
      overdue: t('status.overdue'),
    },
    product: t('product'),
    products: t('products'),
    total: t('total'),
    pendingPayment: t('pendingPayment'),
    hasInvoice: t('hasInvoice'),
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

      <OrdersList
        onlineOrders={onlineOrders}
        businessOrders={businessOrders}
        locale={locale}
        translations={translations}
      />
    </div>
  )
}
