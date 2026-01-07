
'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card, CardContent } from '@calmar/ui'
import { Coins, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

interface PointsRedemptionProps {
  cartTotal: number
  onRedeem: (points: number) => void
  disabled?: boolean
}

export function PointsRedemption({ cartTotal, onRedeem, disabled }: PointsRedemptionProps) {
  const t = useTranslations("Checkout.points")
  const [balance, setBalance] = useState<number | null>(null)
  const [pointsToUse, setPointsToUse] = useState<string>('')
  const [isApplied, setIsApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBalance() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('points_balance')
          .eq('id', user.id)
          .single()
        setBalance(data?.points_balance || 0)
      }
    }
    fetchBalance()
  }, [])

  if (balance === null || balance === 0) return null

  const handleApply = () => {
    const points = parseInt(pointsToUse)
    if (isNaN(points) || points <= 0) {
      setError(t('errorInvalid'))
      return
    }
    if (points > balance) {
      setError(t('errorInsufficient', { max: balance }))
      return
    }
    if (points > cartTotal) {
      setError(t('errorExceeds'))
      return
    }

    setError(null)
    setIsApplied(true)
    onRedeem(points)
  }

  const handleRemove = () => {
    setIsApplied(false)
    setPointsToUse('')
    onRedeem(0)
  }

  return (
    <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-tight text-indigo-900">
            {t('title')}
          </h3>
        </div>

        {isApplied ? (
          <div className="flex items-center justify-between bg-indigo-100/50 p-2 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 rounded-full p-1">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium text-indigo-900">
                {t('applied', { points: parseInt(pointsToUse).toLocaleString('es-CL'), value: parseInt(pointsToUse).toLocaleString('es-CL') })}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemove} className="h-8 w-8 text-indigo-400 hover:text-indigo-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-indigo-700 font-medium">
              {t('available', { points: balance.toLocaleString('es-CL'), value: balance.toLocaleString('es-CL') })}
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t('placeholder')}
                value={pointsToUse}
                onChange={(e) => setPointsToUse(e.target.value)}
                disabled={disabled}
                className="bg-white border-indigo-200 focus-visible:ring-indigo-600"
              />
              <Button 
                type="button" 
                onClick={handleApply}
                disabled={disabled || !pointsToUse}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
              >
                {t('apply')}
              </Button>
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold uppercase">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
