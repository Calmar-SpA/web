'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { CreditCard, AlertTriangle, Calendar, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export interface DebtItem {
  id: string
  reference_number: string
  total_amount: number
  remaining_balance: number
  due_date: string | null
  movement_type: string
  status: string
}

interface DebtCardProps {
  debts: DebtItem[]
  locale: string
}

export function DebtCard({ debts, locale }: DebtCardProps) {
  const t = useTranslations("Account.debt")

  // Calcular totales
  const totalDebt = debts.reduce((sum, d) => sum + d.remaining_balance, 0)
  const overdueDebts = debts.filter(d => {
    if (!d.due_date) return false
    return new Date(d.due_date) < new Date() && d.remaining_balance > 0
  })
  const hasOverdue = overdueDebts.length > 0

  // Ordenar por fecha de vencimiento (más urgente primero)
  const sortedDebts = [...debts].sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilDue = (dateString: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(dateString)
    dueDate.setHours(0, 0, 0, 0)
    const diffTime = dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = (debt: DebtItem) => {
    if (!debt.due_date) return 'bg-slate-100 text-slate-600'
    const days = getDaysUntilDue(debt.due_date)
    if (days < 0) return 'bg-red-100 text-red-700' // Vencido
    if (days <= 7) return 'bg-amber-100 text-amber-700' // Por vencer pronto
    return 'bg-emerald-100 text-emerald-700' // Con tiempo
  }

  const getStatusLabel = (debt: DebtItem) => {
    if (!debt.due_date) return t("noDueDate")
    const days = getDaysUntilDue(debt.due_date)
    if (days < 0) return t("overdue", { days: Math.abs(days) })
    if (days === 0) return t("dueToday")
    if (days === 1) return t("dueTomorrow")
    return t("dueInDays", { days })
  }

  // Estado vacío cuando no hay deudas
  if (debts.length === 0) {
    return (
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-calmar-mint" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </span>
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-emerald-700">{t("noDebt")}</p>
            <p className="text-sm text-slate-500 mt-1">{t("noDebtDesc")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden border shadow-sm ${hasOverdue ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-white'}`}>
      <div className={`h-1.5 ${hasOverdue ? 'bg-gradient-to-r from-red-500 via-red-400 to-amber-500' : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500'}`} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${hasOverdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
              <CreditCard className="h-4 w-4" />
            </span>
            {t("title")}
          </div>
          {hasOverdue && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              {t("hasOverdue", { count: overdueDebts.length })}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Saldo total pendiente */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">{t("totalPending")}</p>
              <span className={`text-3xl sm:text-4xl font-black tracking-tight ${hasOverdue ? 'text-red-700' : 'text-slate-900'}`}>
                ${totalDebt.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{t("pendingItems")}</p>
              <span className="text-lg font-bold text-slate-700">{debts.length}</span>
            </div>
          </div>

          {/* Lista de deudas próximas a vencer */}
          <div className="border-t border-slate-200 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">{t("upcomingPayments")}</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedDebts.slice(0, 5).map((debt) => (
                <Link 
                  key={debt.id}
                  href={`/${locale}/account/orders/m/${debt.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 truncate">
                        #{debt.reference_number}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(debt)}`}>
                        {getStatusLabel(debt)}
                      </span>
                    </div>
                    {debt.due_date && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {t("dueOn", { date: formatDate(debt.due_date) })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      ${debt.remaining_balance.toLocaleString('es-CL')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
            
            {debts.length > 5 && (
              <Link 
                href={`/${locale}/account/orders`}
                className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-calmar-ocean hover:underline"
              >
                {t("viewAll", { count: debts.length })}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
