"use client"

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  Button,
  cn
} from "@calmar/ui"
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"
import { useEffect, useState } from "react"
import Image from "next/image"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, itemCount, isOpen, setIsOpen } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  const [open, setOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync local open state with global store
  useEffect(() => {
    if (isMounted && isOpen) {
      setOpen(true)
      // Reset the global trigger after opening
      setIsOpen(false)
    }
  }, [isOpen, isMounted, setIsOpen])

  if (!isMounted) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative group p-2">
          <ShoppingBag className="w-6 h-6 transition-colors group-hover:text-calmar-ocean" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-calmar-ocean text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0" hideDefaultClose>
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex-1" />
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-calmar-ocean" />
            MI CARRO
          </SheetTitle>
          <div className="flex-1 flex justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-slate-100 h-8 w-8 transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Cerrar</span>
              <div className="relative w-4 h-4">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-900 rotate-45 transform -translate-y-1/2 rounded-full" />
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-900 -rotate-45 transform -translate-y-1/2 rounded-full" />
              </div>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-slate-200" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Tu carro está vacío</p>
                <p className="text-sm text-slate-500">¡Agrega algunos productos para comenzar!</p>
              </div>
              <SheetTrigger asChild>
                <Link href="/shop">
                  <Button className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold">
                    VOLVER A LA TIENDA
                  </Button>
                </Link>
              </SheetTrigger>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                // Simplified image URL handling - matches product page logic
                let productImage = item.product.image_url || (item.product as any).image;
                
                // Only add cache busting for Supabase URLs, use all other URLs as-is
                if (productImage?.includes('supabase.co')) {
                  const timestamp = item.product.updated_at ? new Date(item.product.updated_at).getTime() : Date.now();
                  if (!isNaN(timestamp)) {
                    productImage = `${productImage}${productImage.includes('?') ? '&' : '?'}v=${timestamp}`;
                  }
                }
                
                return (
                <div key={item.product.id} className="p-6 flex gap-4">
                  <div className="relative w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {productImage ? (
                      <img 
                        src={productImage} 
                        alt={item.product.name}
                        className="object-contain w-full h-full p-2"
                      />
                    ) : (
                      <div className="text-slate-300 italic text-[10px]">
                        Sin img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm leading-tight pr-4">{item.product.name}</h4>
                      <button 
                        onClick={() => removeItem(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border rounded-md">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        {(item.product.discount_percentage || (useCart.getState().newsletterDiscount)) ? (
                          <>
                            <p className="text-[10px] text-slate-400 line-through font-bold">
                              ${(item.product.base_price * item.quantity).toLocaleString('es-CL')}
                            </p>
                            <p className="font-black text-calmar-ocean">
                              ${Math.floor((item.product.base_price * item.quantity) * (1 - (item.product.discount_percentage || (useCart.getState().newsletterDiscount || 0)) / 100)).toLocaleString('es-CL')}
                            </p>
                          </>
                        ) : (
                          <p className="font-black text-calmar-ocean">
                            ${(item.product.base_price * item.quantity).toLocaleString('es-CL')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t space-y-4 bg-slate-50/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold">${total.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Despacho</span>
                <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Calculado al checkout</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                <span className="font-black">TOTAL</span>
                <span className="font-black text-calmar-ocean">${total.toLocaleString('es-CL')}</span>
              </div>
            </div>
            
            <Link href="/checkout" className="block w-full">
              <Button className="w-full h-14 bg-slate-900 hover:bg-calmar-ocean text-white font-black shadow-lg shadow-slate-900/20 transition-all active:scale-95">
                INICIAR COMPRA
              </Button>
            </Link>
            
            <p className="text-[10px] text-center text-slate-400 font-medium">
              ENVÍOS A TODO CHILE • PAGOS SEGUROS
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
