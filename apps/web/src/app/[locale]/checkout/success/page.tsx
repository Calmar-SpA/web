"use client"

import { useEffect, Suspense } from "react"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@calmar/ui"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function CheckoutSuccessContent() {
  const { clearCart } = useCart()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')
  const rutUpdated = searchParams.get('rutUpdated') === '1'

  useEffect(() => {
    // Clear cart on successful checkout
    clearCart()
  }, [clearCart])

  // Mostrar orderNumber si existe, sino usar parte del orderId como fallback
  const displayOrderNumber = orderNumber || (orderId ? orderId.slice(0, 8) : null)

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">¡Gracias por tu compra!</h1>
        <p className="text-slate-500 text-lg">
          Hemos recibido tu pedido correctamente. Te enviaremos un correo con los detalles del despacho a la brevedad.
        </p>
        {displayOrderNumber && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Número de Pedido</p>
            <p className="font-mono font-bold text-calmar-ocean">#{displayOrderNumber}</p>
          </div>
        )}
        {rutUpdated && (
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 inline-block">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">RUT actualizado</p>
            <p className="text-sm text-emerald-700">Tu RUT quedó guardado en tu perfil.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Link href="/shop" className="flex-1">
          <Button className="w-full h-14 bg-slate-900 hover:bg-calmar-ocean text-white font-black shadow-lg shadow-slate-900/10">
            Seguir comprando
          </Button>
        </Link>
        <Link href="/account" className="flex-1">
          <Button variant="outline" className="w-full h-14 font-bold border-2">
            Ver mi pedido
          </Button>
        </Link>
      </div>

      <p className="text-xs text-slate-400 font-medium">
        ¿Tienes dudas? Contáctanos a <span className="text-calmar-ocean">contacto@calmar.cl</span>
      </p>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
