'use client'

import { useState } from 'react'
import { Button } from '@calmar/ui'
import { RotateCcw, Loader2 } from 'lucide-react'
import { requestConsignmentReturn } from './actions'
import { useRouter } from 'next/navigation'

interface RequestReturnButtonProps {
  movementId: string
  locale: string
}

export function RequestReturnButton({ movementId, locale }: RequestReturnButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRequestReturn = async () => {
    if (loading || success) return
    
    setLoading(true)
    setError(null)

    try {
      const result = await requestConsignmentReturn(movementId)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Refresh the page to show updated status
        router.refresh()
      }
    } catch (err) {
      setError(locale === 'es' ? 'Error al solicitar devolución' : 'Error requesting return')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-2 px-4 bg-green-500/20 rounded-lg">
        <p className="text-green-400 font-bold text-sm">
          {locale === 'es' ? 'Devolución solicitada' : 'Return requested'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <Button
        onClick={handleRequestReturn}
        disabled={loading}
        variant="outline"
        className="w-full border-white/20 text-white hover:bg-white/10 font-bold h-12"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <RotateCcw className="w-4 h-4 mr-2" />
        )}
        {locale === 'es' ? 'Solicitar Devolución' : 'Request Return'}
      </Button>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
