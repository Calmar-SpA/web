"use client"

import { UnifiedOrderItem } from '@calmar/database'
import { Card, CardContent } from "@calmar/ui"
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle, Gift, FileText, CreditCard, Store, User, Building2 } from "lucide-react"
import { Link } from '@/navigation'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import { useUserMode } from '@/hooks/use-user-mode'

// Status icons and colors for orders (defined here to avoid serialization issues)
const statusMap: Record<string, { icon: typeof Clock; color: string }> = {
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

interface OrdersListProps {
  onlineOrders: UnifiedOrderItem[]
  businessOrders: UnifiedOrderItem[]
  locale: string
  translations: {
    types: { online: string; sample: string; consignment: string; saleInvoice: string; saleCredit: string }
    status: Record<string, string>
    product: string
    products: string
    total: string
    pendingPayment: string
    hasInvoice: string
  }
}

export function OrdersList({ 
  onlineOrders, 
  businessOrders, 
  locale, 
  translations 
}: OrdersListProps) {
  // Type badges for different record types (uses translations from props)
  const typeBadges: Record<string, { label: string; icon: typeof Store; color: string }> = {
    online: { label: translations.types.online, icon: Store, color: 'bg-calmar-ocean/10 text-calmar-ocean' },
    sample: { label: translations.types.sample, icon: Gift, color: 'bg-pink-100 text-pink-700' },
    consignment: { label: translations.types.consignment, icon: Package, color: 'bg-purple-100 text-purple-700' },
    sale_invoice: { label: translations.types.saleInvoice, icon: FileText, color: 'bg-blue-100 text-blue-700' },
    sale_credit: { label: translations.types.saleCredit, icon: CreditCard, color: 'bg-amber-100 text-amber-700' },
  }
  const { mode, setMode } = useUserMode()

  const currentOrders = mode === 'personal' ? onlineOrders : businessOrders
  const emptyMessage = mode === 'personal' 
    ? 'No tienes compras personales aún.' 
    : 'No hay movimientos registrados para tu empresa.'

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            onClick={() => setMode('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'personal' 
                ? 'bg-white text-calmar-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3 h-3" />
            Personal
          </button>
          <button
            onClick={() => setMode('business')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'business' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-3 h-3" />
            Empresa
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {currentOrders.length === 0 ? (
          <Card className="border-dashed border-2 py-8 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center text-center py-4">
              <p className="text-sm text-slate-400 font-medium">{emptyMessage}</p>
            </CardContent>
          </Card>
        ) : (
          currentOrders.map((item) => (
            <OrderCard 
              key={item.id} 
              item={item} 
              translations={translations} 
              locale={locale} 
              typeBadges={typeBadges} 
            />
          ))
        )}
      </div>
    </div>
  )
}

function OrderCard({ 
  item, 
  translations, 
  locale, 
  typeBadges 
}: { 
  item: UnifiedOrderItem
  translations: OrdersListProps['translations']
  locale: string
  typeBadges: Record<string, { label: string; icon: typeof Store; color: string }>
}) {
  const statusConfig = statusMap[item.status] || { icon: Clock, color: 'text-slate-500 bg-slate-50' }
  const StatusIcon = statusConfig.icon
  const statusLabel = translations.status[item.status] || item.status
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
                      {translations.status.overdue}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                  {new Date(item.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                  {item.items_count > 0 && ` · ${item.items_count} ${item.items_count === 1 ? translations.product : translations.products}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{translations.total}</p>
                <p className="font-black text-lg sm:text-xl text-calmar-ocean">
                  ${formatClp(item.total_amount)}
                </p>
                {item.remaining_balance > 0 && item.type !== 'sample' && (
                  <p className={`text-[10px] sm:text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                    {translations.pendingPayment}: ${formatClp(item.remaining_balance)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.invoice_url && (
                  <span title={translations.hasInvoice}>
                    <FileText className="w-4 h-4 text-slate-400" />
                  </span>
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
