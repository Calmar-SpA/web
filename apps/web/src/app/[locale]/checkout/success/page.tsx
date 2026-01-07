"use client"

import { useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@calmar/ui"
import { CheckCircle2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    // Clear cart on successful checkout
    clearCart()
  }, [clearCart])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">¡Gracias por tu compra!</h1>
        <p className="text-slate-500 text-lg">
          Hemos recibido tu pedido correctamente. Te enviaremos un correo con los detalles del despacho a la brevedad.
        </p>
        {orderId && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Número de Pedido</p>
            <p className="font-mono font-bold text-calmar-ocean">#{orderId.slice(0, 8)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Link href="/shop" className="flex-1">
          <Button className="w-full h-14 bg-slate-900 hover:bg-calmar-ocean text-white font-black italic shadow-lg shadow-slate-900/10">
            SEGUIR COMPRANDO
          </Button>
        </Link>
        <Link href="/account" className="flex-1">
          <Button variant="outline" className="w-full h-14 font-bold border-2">
            VER MI PEDIDO
          </Button>
        </Link>
      </div>

      <p className="text-xs text-slate-400 font-medium">
        ¿Tienes dudas? Contáctanos a <span className="text-calmar-ocean">contacto@calmar.cl</span>
      </p>
    </div>
  )
}
