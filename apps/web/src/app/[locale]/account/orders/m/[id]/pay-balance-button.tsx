'use client'

import { useState } from 'react'
import { Button } from '@calmar/ui'
import { CreditCard, Loader2 } from 'lucide-react'
import { initiateMovementPayment } from './actions'
import { formatClp } from '@calmar/utils'

interface PayBalanceButtonProps {
  movementId: string
  amount: number
  locale: string
}

export function PayBalanceButton({ movementId, amount, locale }: PayBalanceButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      const result = await initiateMovementPayment(movementId)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else if (result.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = result.paymentUrl
      }
    } catch (err) {
      setError(locale === 'es' ? 'Error al iniciar el pago' : 'Error initiating payment')
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-calmar-ocean hover:bg-calmar-ocean/90 text-white font-black h-12"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        {locale === 'es' ? `Pagar $${formatClp(amount)}` : `Pay $${formatClp(amount)}`}
      </Button>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
