"use client"

import { Suspense } from "react"
import { Button } from "@calmar/ui"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function CheckoutErrorContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500">
        <AlertCircle className="w-12 h-12" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">Algo salió mal</h1>
        <p className="text-slate-500 text-lg">
          No pudimos procesar tu pago o la transacción fue cancelada. No te hemos realizado ningún cobro.
        </p>
        <p className="text-slate-400 text-sm">
          Si crees que esto es un error, por favor intenta nuevamente o elige otro medio de pago.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Link href="/checkout" className="flex-1">
          <Button className="w-full h-14 bg-slate-900 hover:bg-calmar-ocean text-white font-black shadow-lg shadow-slate-900/10">
            REINTENTAR PAGO
          </Button>
        </Link>
        <Link href="/contact" className="flex-1">
          <Button variant="outline" className="w-full h-14 font-bold border-2">
            SOLICITAR AYUDA
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <CheckoutErrorContent />
    </Suspense>
  )
}
