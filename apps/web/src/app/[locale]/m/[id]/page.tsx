import { createAdminClient } from '@/lib/supabase/admin'
import { OrderService } from '@calmar/database'
import { Card, CardHeader, CardTitle, CardContent, Button } from "@calmar/ui"
import { Package, FileText, CreditCard, Receipt, Gift, Download, Calendar, AlertCircle, CheckCircle2, ArrowRight, Lock, LogIn } from "lucide-react"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import { getTranslations } from 'next-intl/server'

export default async function PublicMovementDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: "Account.movementDetail" })
  const tPublic = await getTranslations({ locale, namespace: "Account.publicMovementDetail" })
  
  const supabase = createAdminClient()
  const orderService = new OrderService(supabase)
  
  const movement = await orderService.getMovementPublic(id)
  
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
    paid: { label: t('status.paid'), color: 'bg-green-100 text-green-700' },
    partial_paid: { label: t('status.partialPaid'), color: 'bg-amber-100 text-amber-700' },
    overdue: { label: t('status.overdue'), color: 'bg-red-100 text-red-700' },
  }

  const typeInfo = typeLabels[movement.movement_type] || typeLabels.sale_invoice
  const TypeIcon = typeInfo.icon
  const statusInfo = statusLabels[movement.status] || statusLabels.pending
  
  const remainingBalance = movement.remaining_balance || 0
  const isOverdue = movement.due_date && new Date(movement.due_date) < new Date() && remainingBalance > 0
  const items = Array.isArray(movement.items) ? movement.items : []

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Public View Banner */}
      <div className="bg-slate-900 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-calmar-mint" />
            <p className="text-xs font-medium">
              <span className="font-bold text-calmar-mint uppercase tracking-wider mr-2">{tPublic('publicView')}</span>
              {tPublic('readOnlyDescription')}
            </p>
          </div>
          <Link href={`/${locale}/login?redirect=/account/orders/m/${id}`}>
            <Button size="sm" variant="secondary" className="h-8 text-[10px] font-black uppercase tracking-widest bg-calmar-mint text-slate-900 hover:bg-white border-0">
              {tPublic('loginToManage')}
              <LogIn className="w-3 h-3 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-[95%] max-w-6xl mx-auto py-8 sm:py-12">
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
                    const { net: lineNet } = getPriceBreakdown(lineTotal)
                    
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
              {(() => {
                const currentDocs = movement.documents?.filter((d: any) => d.is_current) || []
                const hasLegacyDocs = movement.invoice_url || movement.dispatch_order_url
                
                if (currentDocs.length === 0 && !hasLegacyDocs) return null

                return (
                  <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-50 px-6 py-4">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        {t('documents')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {currentDocs.length > 0 ? (
                        currentDocs.map((doc: any) => {
                          let label = t('invoiceDocument')
                          let icon = FileText
                          let colorClass = "text-calmar-ocean group-hover:text-white"
                          let bgHoverClass = "hover:bg-calmar-ocean"

                          if (doc.document_type === 'guia_despacho') {
                            label = t('dispatchDocument')
                            icon = Package
                            colorClass = "text-purple-600 group-hover:text-white"
                            bgHoverClass = "hover:bg-purple-600"
                          } else if (doc.document_type === 'nota_credito') {
                            label = 'Nota de Crédito'
                            icon = FileText
                            colorClass = "text-amber-600 group-hover:text-white"
                            bgHoverClass = "hover:bg-amber-600"
                          } else if (doc.document_type === 'nota_debito') {
                            label = 'Nota de Débito'
                            icon = FileText
                            colorClass = "text-slate-600 group-hover:text-white"
                            bgHoverClass = "hover:bg-slate-600"
                          } else if (doc.document_type === 'boleta') {
                            label = 'Boleta'
                            icon = FileText
                            colorClass = "text-teal-600 group-hover:text-white"
                            bgHoverClass = "hover:bg-teal-600"
                          }

                          const Icon = icon

                          return (
                            <a key={doc.id} href={doc.document_url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl ${bgHoverClass} hover:text-white transition-all group`}>
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${colorClass} transition-colors`} />
                                <div className="flex flex-col">
                                  <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
                                  {doc.document_number && <span className="text-[9px] opacity-70">Nº {doc.document_number}</span>}
                                </div>
                              </div>
                              <Download className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                            </a>
                          )
                        })
                      ) : (
                        <>
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
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })()}

            </div>
          </div>

          {/* Summary Section - Full Width */}
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

                {/* Login CTA Side */}
                <div className="p-8 md:p-10 bg-gradient-to-br from-white/[0.02] to-white/[0.05] flex flex-col justify-center items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-2">
                    <LogIn className="w-8 h-8 text-calmar-mint" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">
                      {tPublic('ctaTitle')}
                    </h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                      {tPublic('ctaDescription')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <Link href={`/${locale}/login?redirect=/account/orders/m/${id}`} className="w-full">
                      <Button className="w-full bg-calmar-mint text-slate-900 hover:bg-white font-black uppercase tracking-widest">
                        {tPublic('login')}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/register`} className="w-full">
                      <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-black uppercase tracking-widest">
                        {tPublic('register')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
