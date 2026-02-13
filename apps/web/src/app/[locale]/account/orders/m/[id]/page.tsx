'use client'

import { createClient } from '@/lib/supabase/client'
import { OrderService } from '@calmar/database'
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, ChevronLeft, FileText, CreditCard, Receipt, Gift, RotateCcw, Download, Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from 'next/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import { useTranslations } from 'next-intl'
import { RequestReturnButton } from './request-return-button'
import { PayBalanceButton } from './pay-balance-button'
import { TransferPaymentForm } from './transfer-payment-form'
import { useState, useEffect, use } from 'react'

export default function MovementDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}) {
  const { id, locale } = use(params)
  const t = useTranslations("Account.movementDetail")
  const router = useRouter()
  
  const [movement, setMovement] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card')
  const [bankData, setBankData] = useState<any>({
    bank_name: 'Banco Santander',
    account_type: 'Cuenta Corriente',
    account_number: '770286824',
    account_holder: 'Tu Patrimonio SpA',
    rut: '77.028.682-4',
    email: 'felipe@tupatrimonio.cl'
  })

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/${locale}/login`)
        return
      }

      const orderService = new OrderService(supabase)
      try {
        const data = await orderService.getMovementForUser(id)
        if (!data) {
          notFound()
          return
        }
        setMovement(data)

        // Load bank settings
        const { data: settings } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'bank_account_for_transfers')
          .single()

        if (settings?.setting_value) {
          setBankData(settings.setting_value)
        }
      } catch (error) {
        console.error('Error fetching movement:', error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, locale, router])

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-calmar-ocean border-t-transparent rounded-full"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cargando detalles...</p>
        </div>
      </div>
    )
  }

  if (!movement) return null

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

  // Check for pending payments
  const pendingPayments = movement.payments?.filter((p: any) => p.verification_status === 'pending') || []
  const hasPendingPayment = pendingPayments.length > 0

  return (
    <div className="w-[95%] max-w-6xl mx-auto py-8 sm:py-12">
      {/* Back link */}
      <div className="mb-8">
        <Link href={`/${locale}/account/orders`} className="group text-slate-400 hover:text-calmar-ocean flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
          <div className="p-1.5 rounded-full bg-slate-100 group-hover:bg-calmar-ocean/10 transition-colors">
            <ChevronLeft className="w-3 h-3" />
          </div>
          {t('backToOrders')}
        </Link>
      </div>

      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-slate-900">
              {movement.movement_number || `#${movement.id.slice(0, 8)}`}
            </h1>
            <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${typeInfo.color} border border-current/10`}>
              <TypeIcon className="w-3 h-3" />
              {typeInfo.label}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <div className={`w-2 h-2 rounded-full ${statusInfo.color.split(' ')[0].replace('bg-', 'bg-')}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{statusInfo.label}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date(movement.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            {movement.due_date && (
              <div className={`flex items-center gap-2 text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                <Calendar className="w-4 h-4" />
                <span>Vence: {new Date(movement.due_date).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'long' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-red-900 uppercase tracking-tight">{t('overdueAlert.title')}</p>
            <p className="text-sm text-red-700/80 font-medium">{t('overdueAlert.description')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        <div className="space-y-8">
          {/* Products Card */}
          <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-3xl">
            <CardHeader className="border-b border-slate-50 px-8 py-6">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-400">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <Package className="w-4 h-4" />
                </div>
                {t('products')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {items.map((item: any, index: number) => {
                  const lineTotal = (item.unit_price || 0) * (item.quantity || 0)
                  const { net: lineNet, iva: lineIva } = getPriceBreakdown(lineTotal)
                  
                  return (
                    <div key={item.product_id || index} className="p-8 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center p-3 border border-slate-100 shadow-inner">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product?.name} className="object-contain w-full h-full" />
                        ) : (
                          <Package className="w-8 h-8 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h4 className="font-black text-slate-900 text-lg leading-tight truncate uppercase tracking-tight">
                            {item.product?.name || item.product?.sku || t('unknownProduct')}
                          </h4>
                          <div className="text-right">
                            {movement.movement_type === 'sample' ? (
                               <p className="font-black text-emerald-600 text-xl tracking-tighter">GRATIS</p>
                            ) : (
                               <>
                                 <p className="font-black text-slate-900 text-xl tracking-tighter">${formatClp(lineTotal)}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neto: ${formatClp(lineNet)}</p>
                               </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1 bg-calmar-ocean/5 rounded-full border border-calmar-ocean/10">
                            <span className="text-[10px] font-black text-calmar-ocean uppercase tracking-widest">{t('quantity')}: {item.quantity}</span>
                          </div>
                          {movement.movement_type !== 'sample' && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${formatClp(item.unit_price)} c/u</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Documents & Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Documents */}
            {(movement.invoice_url || movement.dispatch_order_url) && (
              <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 px-6 py-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    {t('documents')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {movement.invoice_url && (
                    <a href={movement.invoice_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-calmar-ocean hover:text-white transition-all group">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-calmar-ocean group-hover:text-white transition-colors" />
                        <span className="font-black text-[10px] uppercase tracking-widest">{t('invoiceDocument')}</span>
                      </div>
                      <Download className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    </a>
                  )}
                  {movement.dispatch_order_url && (
                    <a href={movement.dispatch_order_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-purple-600 hover:text-white transition-all group">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                        <span className="font-black text-[10px] uppercase tracking-widest">{t('dispatchDocument')}</span>
                      </div>
                      <Download className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {movement.notes && (
              <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 px-6 py-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5" />
                    {t('notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{movement.notes}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment History */}
          {movement.payments && movement.payments.length > 0 && (
            <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-8 py-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('paymentHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {movement.payments.map((payment: any) => (
                    <div key={payment.id} className="p-6 px-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 tracking-tight">${formatClp(payment.amount)}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>{new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-CL')}</span>
                          <span>•</span>
                          <span className="text-calmar-ocean">{payment.payment_method}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {payment.payment_reference && (
                          <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{payment.payment_reference}</span>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${payment.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {payment.verification_status || 'Completado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary & Payment Section - Full Width */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white overflow-hidden border-0 shadow-2xl shadow-slate-950/50 rounded-3xl">
            <div className="h-1.5 bg-gradient-to-r from-calmar-ocean via-calmar-mint to-calmar-ocean animate-gradient-x" />
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {/* Summary Side */}
              <div className="p-8 md:p-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-calmar-mint/10 rounded-2xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-calmar-mint" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.25em] text-calmar-mint">
                    {t('summary')}
                  </h2>
                </div>
                
                <div className="space-y-5">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{t('totalAmount')}</span>
                      <span className={`font-black text-3xl tracking-tighter ${movement.movement_type === 'sample' ? 'text-emerald-400' : ''}`}>
                         {movement.movement_type === 'sample' ? 'GRATIS' : `$${formatClp(movement.total_amount)}`}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">{t('amountPaid')}</span>
                      <span className="font-black text-calmar-mint text-2xl tracking-tighter">${formatClp(movement.total_paid)}</span>
                    </div>

                    {hasPendingPayment && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <div className="flex justify-between items-center bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 animate-pulse">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">{t('pendingVerification') || 'En Verificación'}</span>
                          </div>
                          <span className="font-black text-amber-400 text-xl">
                            ${formatClp(pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className={`p-8 rounded-3xl border-2 relative overflow-hidden ${
                    remainingBalance > 0 && movement.movement_type !== 'sample' 
                      ? isOverdue 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : 'bg-gradient-to-br from-calmar-ocean/10 to-calmar-mint/10 border-calmar-mint/30'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {remainingBalance > 0 && movement.movement_type !== 'sample' ? (
                      <>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-calmar-mint/10 to-transparent rounded-full -translate-y-20 translate-x-20 blur-2xl"></div>
                        <div className="relative space-y-3">
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center animate-bounce">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              </div>
                            )}
                            <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                              {t('pendingBalance')}
                            </p>
                          </div>
                          <div className={`text-5xl font-black tracking-tighter ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                            ${formatClp(remainingBalance)}
                          </div>
                        </div>
                      </>
                    ) : movement.movement_type === 'sample' ? (
                      <div className="text-center">
                        <p className="text-calmar-mint font-black text-sm uppercase tracking-[0.2em]">{t('sampleNoPayment')}</p>
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 font-black text-sm uppercase tracking-[0.2em]">{t('status.paid')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Side */}
              <div className="p-8 md:p-10 bg-gradient-to-br from-white/[0.02] to-white/[0.05]">
                {canPay && !hasPendingPayment ? (
                  <div className="space-y-7">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                        {locale === 'es' ? 'Método de Pago' : 'Payment Method'}
                      </h3>
                      
                      <div className="flex p-1.5 bg-slate-800/50 rounded-2xl h-14 border border-white/10 shadow-inner">
                        <button 
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'card' ? 'bg-calmar-ocean text-white shadow-xl shadow-calmar-ocean/30 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                          <CreditCard className="w-4 h-4" />
                          {locale === 'es' ? 'Tarjeta' : 'Card'}
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('transfer')}
                          className={`flex-1 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'transfer' ? 'bg-slate-700 text-white shadow-xl shadow-slate-700/30 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {locale === 'es' ? 'Transferencia' : 'Transfer'}
                        </button>
                      </div>
                    </div>

                    {paymentMethod === 'card' ? (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto w-full pt-4">
                        <PayBalanceButton 
                          movementId={movement.id}
                          amount={remainingBalance}
                          locale={locale}
                        />
                        <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[10px] text-slate-400 text-center leading-relaxed uppercase font-bold tracking-[0.15em]">
                            {locale === 'es' ? '🔒 Pago seguro vía Flow' : '🔒 Secure payment via Flow'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-br from-calmar-mint/5 to-calmar-ocean/5 p-6 rounded-3xl border border-calmar-mint/20 space-y-5 relative overflow-hidden group shadow-lg shadow-calmar-mint/5">
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-calmar-mint/5 rounded-full blur-3xl group-hover:bg-calmar-mint/10 transition-all"></div>
                          
                          <div className="flex items-center gap-3 relative">
                            <div className="w-10 h-10 bg-calmar-mint/10 rounded-xl flex items-center justify-center">
                              <RotateCcw className="w-5 h-5 text-calmar-mint" />
                            </div>
                            <p className="font-black text-calmar-mint text-xs uppercase tracking-[0.25em]">
                              {locale === 'es' ? 'Datos Bancarios' : 'Bank Transfer Details'}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 relative">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-all">
                              <span className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em]">Banco</span>
                              <p className="font-black text-sm text-white">{bankData.bank_name}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-all">
                              <span className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em]">Tipo</span>
                              <p className="font-black text-sm text-white">{bankData.account_type}</p>
                            </div>
                            <div className="col-span-2 bg-slate-800/50 p-5 rounded-2xl border-2 border-calmar-mint/30 space-y-2 hover:border-calmar-mint/50 transition-all">
                              <span className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em]">Nº de Cuenta</span>
                              <p className="font-mono font-black text-2xl text-calmar-mint tracking-wider">{bankData.account_number}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-all">
                              <span className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em]">RUT</span>
                              <p className="font-black text-sm text-white">{bankData.rut}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-all">
                              <span className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em]">Nombre</span>
                              <p className="font-black text-[10px] text-white uppercase leading-tight">{bankData.account_holder}</p>
                            </div>
                          </div>
                        </div>

                        <TransferPaymentForm 
                          movementId={movement.id}
                          amount={remainingBalance}
                          locale={locale}
                        />
                      </div>
                    )}
                  </div>
                ) : hasPendingPayment ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 bg-amber-500/5 rounded-3xl border border-amber-500/10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">
                        {locale === 'es' ? 'Validando Pago' : 'Validating Payment'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
                        {locale === 'es' 
                          ? 'Hemos recibido tu comprobante. Nuestro equipo lo validará a la brevedad.' 
                          : 'We have received your receipt. Our team will validate it shortly.'}
                      </p>
                    </div>
                  </div>
                ) : canRequestReturn ? (
                  <div className="h-full flex items-center justify-center">
                    <RequestReturnButton 
                      movementId={movement.id}
                      locale={locale}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {locale === 'es' ? 'No hay acciones pendientes' : 'No pending actions'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Help Card - Full Width */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-calmar-ocean/30 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean group-hover:scale-110 transition-transform">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">{locale === 'es' ? '¿Necesitas ayuda con tu pago?' : 'Need help with your payment?'}</p>
                <p className="text-sm text-slate-500 font-medium">{locale === 'es' ? 'Nuestro equipo de soporte está disponible para asistirte.' : 'Our support team is available to assist you.'}</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] border-2 hover:bg-calmar-ocean hover:text-white hover:border-calmar-ocean transition-all">
              {locale === 'es' ? 'Contactar Soporte' : 'Contact Support'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
