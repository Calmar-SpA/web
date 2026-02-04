'use client'

import { useEffect } from 'react'
import { Button } from '@calmar/ui'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error para debugging (solo en desarrollo)
    console.error('[PAGE ERROR]', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icono */}
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Título y descripción */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Algo salió mal
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Ocurrió un error inesperado. Por favor, intenta nuevamente o vuelve al inicio.
          </p>
        </div>

        {/* Código de error (solo si existe digest) */}
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            Código: {error.digest}
          </p>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        {/* Mensaje de ayuda */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Si el problema persiste, contáctanos a{' '}
          <a 
            href="mailto:contacto@calmar.cl" 
            className="text-calmar-ocean hover:underline"
          >
            contacto@calmar.cl
          </a>
        </p>
      </div>
    </div>
  )
}
