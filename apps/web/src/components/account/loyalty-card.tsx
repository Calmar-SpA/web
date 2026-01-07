
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
    <Card className="overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-indigo-100 uppercase tracking-wider">
          <Coins className="h-4 w-4" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <span className="text-4xl font-bold tracking-tight">
            {balance.toLocaleString('es-CL')}
          </span>
          <p className="mt-1 text-sm text-indigo-100 opacity-80">
            {t("equivalent", { value: balance.toLocaleString('es-CL') })}
          </p>
          
          <div className="mt-6 flex items-center justify-between border-t border-indigo-500/30 pt-4">
            <span className="text-xs font-medium text-indigo-100">{t("memberSince")}</span>
            <button className="flex items-center gap-1 text-xs font-semibold hover:underline">
              <History className="h-3 w-3" />
              {t("history")}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
