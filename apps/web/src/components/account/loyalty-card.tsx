
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { Coins, History } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface LoyaltyCardProps {
  balance: number
}

export function LoyaltyCard({ balance }: LoyaltyCardProps) {
  const t = useTranslations("Account.loyalty")

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-calmar-ocean via-calmar-primary to-calmar-mint" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-calmar-ocean/10 text-calmar-ocean">
            <Coins className="h-4 w-4" />
          </span>
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {balance.toLocaleString('es-CL')}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {t("equivalent", { value: balance.toLocaleString('es-CL') })}
          </p>
          
          <div className="flex items-center justify-end border-t border-slate-200 pt-3">
            <button className="flex items-center gap-1 text-xs font-semibold text-calmar-ocean hover:underline">
              <History className="h-3 w-3" />
              {t("history")}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
