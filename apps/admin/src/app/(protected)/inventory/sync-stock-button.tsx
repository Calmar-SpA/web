'use client'

import { Button } from '@calmar/ui'
import { useState } from 'react'
import { toast } from 'sonner'
import { syncInventory } from './actions'
import { RefreshCw } from 'lucide-react'

export function SyncStockButton() {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const result = await syncInventory()
      
      if (result.success) {
        toast.success('Stock sincronizado correctamente')
      } else {
        toast.error('Error al sincronizar stock: ' + result.error)
      }
    } catch (error) {
      toast.error('Error inesperado al sincronizar stock')
      console.error(error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button 
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing}
      className="bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-xs tracking-widest px-4 border-slate-200 shadow-sm"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Sincronizando...' : 'Sincronizar Stock'}
    </Button>
  )
}
