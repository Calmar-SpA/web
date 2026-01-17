'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

const messages: Record<string, string> = {
  created: 'Item agregado correctamente',
  updated: 'Item actualizado correctamente',
  duplicated: 'Item copiado correctamente',
  deleted: 'Item eliminado correctamente',
  supplier_updated: 'Proveedor actualizado correctamente',
}

export function SuccessToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success')

  useEffect(() => {
    if (success && messages[success]) {
      toast.success(messages[success])
      // Limpiar el parámetro de la URL
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      router.replace(url.pathname, { scroll: false })
    }
  }, [success, router])

  return null
}
