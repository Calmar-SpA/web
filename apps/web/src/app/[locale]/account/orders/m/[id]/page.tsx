import { createClient } from '@/lib/supabase/server'
import { OrderService } from '@calmar/database'
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, ChevronLeft, FileText, CreditCard, Receipt, Gift, RotateCcw, Download, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from 'next/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import { getTranslations } from 'next-intl/server'
import { RequestReturnButton } from './request-return-button'
import { PayBalanceButton } from './pay-balance-button'

export default async function MovementDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}) {
  const { id, locale } = await params
  const t = await getTranslations("Account.movementDetail")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const orderService = new OrderService(supabase)
  
  let movement: any = null
  try {
    movement = await orderService.getMovementForUser(id)
  } catch (error) {
    console.error('Error fetching movement:', error)
    notFound()
  }

  if (!movement) {
    notFound()
  }

  // Type labels
  const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
    sample: { label: t('types.sample'), icon: Gift, color: 'bg-pink-100 text-pink-700' },
    consignment: { label: t('types.consignment'), icon: Package, color: 'bg-purple-100 text-purple-700' },
    sale_invoice: { label: t('types.saleInvoice'), icon: FileText, color: 'bg-blue-100 text-blue-700' },
    sale_credit: { label: t('types.saleCredit'), icon: CreditCard, color: 'bg-amber-100 text-amber-700' },
  }

  // Status labels
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: t('status.pending'), color: 'bg-amber-100 text-amber-700' },
    delivered: { label: t('status.delivered'), color: 'bg-green-100 text-green-700' },
    returned: { label: t('status.returned'), color: 'bg-orange-100 text-orange-700' },
    sold: { label: t('status.sold'), color: 'bg-emerald-100 text-emerald-700' },
    paid: { label: t('status.paid'), color: 'bg-green-100 text-green-700' },
    partial_paid: { label: t('status.partialPaid'), color: 'bg-amber-100 text-amber-700' },
    overdue: { label: t('status.overdue'), color: 'bg-red-100 text-red-700' },
  }

  const typeInfo = typeLabels[movement.movement_type] || typeLabels.sale_invoice
  const TypeIcon = typeInfo.icon
  const statusInfo = statusLabels[movement.status] || statusLabels.pending
  
  const { net: totalNet, iva: totalIva } = getPriceBreakdown(movement.total_amount)
  const remainingBalance = movement.remaining_balance || 0
  const isOverdue = movement.due_date && new Date(movement.due_date) < new Date() && remainingBalance > 0
  const canRequestReturn = movement.movement_type === 'consignment' && movement.status === 'delivered'
  const canPay = remainingBalance > 0 && movement.movement_type !== 'sample'
  const items = Array.isArray(movement.items) ? movement.items : []

  return (
    <div className="w-[90%] max-w-4xl mx-auto py-8 sm:py-12">
      {/* Back link */}
      <div className="mb-6 sm:mb-8">
        <Link href={`/${locale}/account/orders`} className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-4 h-4" /> {t('backToOrders')}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase">
                {movement.movement_number || `#${movement.id.slice(0, 8)}`}
              </h1>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${typeInfo.color}`}>
                <TypeIcon className="w-3 h-3" />
                {typeInfo.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {t('status.overdue')}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-3">
          {t('createdAt', { 
            date: new Date(movement.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }) 
          })}
        </p>
        {movement.due_date && (
          <p className={`text-sm mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
            <Calendar className="w-4 h-4" />
            {t('dueDate', { 
              date: new Date(movement.due_date).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              }) 
            })}
          </p>
        )}
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">{t('overdueAlert.title')}</p>
            <p className="text-sm text-red-700">{t('overdueAlert.description')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Products */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-calmar-ocean" />
                {t('products')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {items.map((item: any, index: number) => {
                  const lineTotal = (item.unit_price || 0) * (item.quantity || 0)
                  const { net: lineNet, iva: lineIva } = getPriceBreakdown(lineTotal)
                  
                  return (
                    <div key={item.product_id || index} className="p-4 sm:p-6 flex gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                        {item.product?.image_url ? (
                          <img 
                            src={item.product.image_url}
                            alt={item.product?.name || 'Producto'}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <Package className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-bold text-sm sm:text-base truncate">
                            {item.product?.name || item.product?.sku || t('unknownProduct')}
                          </h4>
                          <p className="text-xs text-slate-500">{t('quantity')}: {item.quantity}</p>
                        </div>
                        <div>
                          <p className="font-black text-calmar-ocean text-sm sm:text-base">
                            ${formatClp(lineTotal)}
                          </p>
                          <p className="text-[10px] text-slate-400 hidden sm:block">
                            {`Neto: $${formatClp(lineNet)} · IVA: $${formatClp(lineIva)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {(movement.invoice_url || movement.dispatch_order_url) && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-calmar-ocean" />
                  {t('documents')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                {movement.invoice_url && (
                  <a 
                    href={movement.invoice_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-calmar-ocean" />
                      <span className="font-medium text-sm">{t('invoiceDocument')}</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </a>
                )}
                {movement.dispatch_order_url && (
                  <a 
                    href={movement.dispatch_order_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-sm">{t('dispatchDocument')}</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {movement.payments && movement.payments.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-calmar-ocean" />
                  {t('paymentHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {movement.payments.map((payment: any) => (
                    <div key={payment.id} className="p-4 sm:p-6 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">${formatClp(payment.amount)}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(payment.paid_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        {payment.payment_reference && (
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            Ref: {payment.payment_reference}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {payment.payment_method}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {movement.notes && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg uppercase tracking-tight">
                  {t('notes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{movement.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-4">
          <Card className="bg-slate-900 text-white lg:sticky lg:top-32">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg uppercase tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-calmar-mint" />
                {t('summary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('totalAmount')}</span>
                  <span className="font-bold">${formatClp(movement.total_amount)}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  {`Neto: $${formatClp(totalNet)} · IVA: $${formatClp(totalIva)}`}
                </p>
                
                {movement.total_paid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t('amountPaid')}</span>
                    <span className="font-bold text-calmar-mint">${formatClp(movement.total_paid)}</span>
                  </div>
                )}
              </div>

              {remainingBalance > 0 && movement.movement_type !== 'sample' && (
                <div className={`flex justify-between text-lg uppercase ${isOverdue ? 'text-red-400' : ''}`}>
                  <span className="font-black">{t('pendingBalance')}</span>
                  <span className="font-black">${formatClp(remainingBalance)}</span>
                </div>
              )}

              {movement.movement_type === 'sample' && (
                <div className="text-center py-2">
                  <p className="text-calmar-mint font-bold text-sm">{t('sampleNoPayment')}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                {canPay && (
                  <PayBalanceButton 
                    movementId={movement.id}
                    amount={remainingBalance}
                    locale={locale}
                  />
                )}
                
                {canRequestReturn && (
                  <RequestReturnButton 
                    movementId={movement.id}
                    locale={locale}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
